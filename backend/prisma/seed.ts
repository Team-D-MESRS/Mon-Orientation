import { PrismaClient, Prisma, TypeEtablissement } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { REFERENTIEL_FILIERES } from './data/referentiel-filieres';
import { ECOLES_METIERS, FICHES_CATALOGUE, SPECIALITES_REPERTOIRE, cleIntitule } from './data/correspondances-eftp';
import { FICHES_METIERS } from './data/fiches-metiers';
import { VIDEOS_FILIERES } from './data/videos-filieres';
import { estDomaine } from '../src/filiere/domaines';

/** Filières du supérieur extraites du guide officiel du MESRS (data/outils/extraire-guide-mesrs.py). */
interface GuideMesrs {
  source: { libelle: string; url: string; consulteLe: string };
  etablissements: { code: string; nom: string; sigle: string; universite: string }[];
  filieres: {
    code: string;
    nom: string;
    etablissement: string;
    page: number;
    description: string;
    quotaBourses: number | null;
    quotaAides: number | null;
    modeEntree: string | null;
    seriesRecommandees: string | null;
    seriesAdmises: string[];
    matieresClassement: string | null;
    matieresCles: string[];
    metiersVises: string[];
    conditionsAcces: string;
    domaines: string[];
  }[];
}

/** Répertoires officiels des lycées techniques (data/outils/extraire-repertoires-eftp.py). */
interface RepertoiresEftp {
  sources: { libelle: string }[];
  etablissements: {
    code: string;
    nom: string;
    type: TypeEtablissement;
    departement: string;
    commune: string;
    quartier: string | null;
    externat: boolean | null;
    internat: boolean | null;
  }[];
  offres: { etablissement: string; specialite: string; duree: string | null; origine: 'LTP' | 'LTA' }[];
}

/** Catalogues officiels des nouveaux métiers (data/outils/extraire-metiers-dtm.py). */
interface CatalogueMetiers {
  sources: { libelle: string }[];
  metiers: { origine: 'LTP' | 'LTA'; numero: number; titre: string; etablissements?: string[] }[];
}

const lire = <T>(fichier: string): T => JSON.parse(fs.readFileSync(path.join(__dirname, 'data', fichier), 'utf8'));
const GUIDE = lire<GuideMesrs>('guide-mesrs-2026-2027.json');
const REPERTOIRES = lire<RepertoiresEftp>('repertoires-eftp.json');
const CATALOGUE = lire<CatalogueMetiers>('metiers-dtm.json');
/** Les deux extracteurs écrivent leurs sources dans l'ordre LTP puis LTA. */
const rangSource = (origine: 'LTP' | 'LTA') => (origine === 'LTP' ? 0 : 1);
const json = (valeur: unknown[]) => (valeur.length > 0 ? (valeur as Prisma.InputJsonValue) : Prisma.DbNull);

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const motDePasseAdmin = process.env.SEED_ADMIN_PASSWORD ?? (process.env.NODE_ENV === 'production' ? undefined : 'admin123');
  if (!motDePasseAdmin) {
    throw new Error('SEED_ADMIN_PASSWORD est obligatoire en production');
  }
  const adminHash = await bcrypt.hash(motDePasseAdmin, 12);
  await prisma.utilisateur.upsert({
    where: { email: 'admin@monorientation.bj' },
    update: {},
    create: {
      email: 'admin@monorientation.bj',
      nom: 'Admin',
      prenom: 'Système',
      hashMotDePasse: adminHash,
      role: 'ADMIN',
    },
  });

  const sansDomaine = [...REFERENTIEL_FILIERES, ...GUIDE.filieres].filter((f) => f.domaines.length === 0 || !f.domaines.every(estDomaine));
  if (sansDomaine.length > 0) {
    throw new Error(`Domaines absents ou inconnus : ${sansDomaine.map((f) => f.code).join(', ')}`);
  }

  for (const f of REFERENTIEL_FILIERES) {
    const data = {
      nom: f.nom,
      type: f.type,
      niveauAcces: f.niveauAcces ?? null,
      description: f.description,
      diplomesDelivres: f.diplomesDelivres ?? Prisma.DbNull,
      metiersVises: f.metiersVises ?? Prisma.DbNull,
      debouches: f.debouches ?? null,
      tauxInsertion: null,
      conditionsAcces: f.conditionsAcces ?? null,
      seriesAdmises: f.seriesAdmises ?? Prisma.DbNull,
      ouSeFormer: f.ouSeFormer ?? null,
      bourses: f.bourses ?? null,
      sources: f.sources as unknown as Prisma.InputJsonValue,
      domaines: f.domaines,
      masquee: f.masquee ?? false,
      videoUrl: VIDEOS_FILIERES[f.code] ?? null,
    };
    await prisma.filiere.upsert({
      where: { code: f.code },
      update: data,
      create: { code: f.code, ...data },
    });
  }

  const lieux = await rattacherLieuxDeFormation();

  // Supérieur : établissements et filières du guide officiel du MESRS
  const etablissements = new Map<string, { id: string; nom: string; universite: string }>();
  for (const e of GUIDE.etablissements) {
    const data = { nom: e.nom, sigle: e.sigle, universite: e.universite, type: 'UNIVERSITE' as const };
    const { id } = await prisma.etablissement.upsert({ where: { code: e.code }, update: data, create: { code: e.code, ...data } });
    etablissements.set(e.code, { id, nom: e.nom, universite: e.universite });
  }
  for (const f of GUIDE.filieres) {
    const etablissement = etablissements.get(f.etablissement);
    if (!etablissement) throw new Error(`Établissement inconnu pour ${f.code} : ${f.etablissement}`);
    const data = {
      nom: f.nom,
      type: 'UNIVERSITE' as const,
      niveauAcces: 'APRES_BAC' as const,
      description: f.description,
      diplomesDelivres: Prisma.DbNull,
      metiersVises: json(f.metiersVises),
      debouches: null,
      tauxInsertion: null,
      conditionsAcces: f.conditionsAcces,
      seriesAdmises: json(f.seriesAdmises),
      ouSeFormer: `${etablissement.nom} — ${etablissement.universite}`,
      bourses: f.quotaBourses === null ? null : f.quotaBourses > 0,
      sources: [
        { libelle: `${GUIDE.source.libelle}, p. ${f.page}`, url: GUIDE.source.url, consulteLe: GUIDE.source.consulteLe, officielle: true },
      ] as Prisma.InputJsonValue,
      domaines: f.domaines,
      quotaBourses: f.quotaBourses,
      quotaAides: f.quotaAides,
      modeEntree: f.modeEntree,
      seriesRecommandees: f.seriesRecommandees,
      matieresClassement: f.matieresClassement,
      matieresCles: json(f.matieresCles),
      etablissementId: etablissement.id,
      videoUrl: VIDEOS_FILIERES[f.code] ?? null,
    };
    await prisma.filiere.upsert({ where: { code: f.code }, update: data, create: { code: f.code, ...data } });
  }

  // Filières du supérieur de l'ancien référentiel absentes du guide : leurs recommandations (recalculables)
  // sont retirées, puis la filière est supprimée si aucun vœu, favori, note ni conversation ne la référence
  const codesGuide = new Set(GUIDE.filieres.map((f) => f.code));
  const obsoletes = (await prisma.filiere.findMany({ where: { code: { startsWith: 'UNIV-' } }, select: { id: true, code: true } })).filter(
    (f) => !codesGuide.has(f.code as string),
  );
  await prisma.recommandation.deleteMany({ where: { filiereId: { in: obsoletes.map((f) => f.id) } } });
  const { count: obsoletesSupprimees } = await prisma.filiere.deleteMany({
    where: {
      id: { in: obsoletes.map((f) => f.id) },
      notes: { none: {} },
      preferences1: { none: {} },
      preferences2: { none: {} },
      preferences3: { none: {} },
      favoris: { none: {} },
      conversations: { none: {} },
    },
  });

  // Fiches retirées du référentiel : les écoles des métiers de référence, devenues des lieux de
  // formation rattachés aux DTM, et l'ancien « DT — Contrôleur de qualité de l'eau », que le
  // communiqué N°0902 classe en DTM (repris sous le code DTM-LTP-QUALITE-EAU)
  const retirees = await prisma.filiere.findMany({
    where: { OR: [{ code: { startsWith: 'EDM-' } }, { code: 'DT-QUALITE-EAU' }] },
    select: { id: true },
  });
  await prisma.recommandation.deleteMany({ where: { filiereId: { in: retirees.map((f) => f.id) } } });
  const { count: retireesSupprimees } = await prisma.filiere.deleteMany({
    where: {
      id: { in: retirees.map((f) => f.id) },
      notes: { none: {} },
      preferences1: { none: {} },
      preferences2: { none: {} },
      preferences3: { none: {} },
      favoris: { none: {} },
      conversations: { none: {} },
    },
  });

  // Filières de démonstration antérieures au référentiel (sans code) : supprimées tant que rien ne les référence
  const { count: demoSupprimees } = await prisma.filiere.deleteMany({
    where: {
      code: null,
      notes: { none: {} },
      preferences1: { none: {} },
      preferences2: { none: {} },
      preferences3: { none: {} },
      recommandations: { none: {} },
      conversations: { none: {} },
    },
  });

  console.log(
    `✅ Seed terminé : ${REFERENTIEL_FILIERES.length} filières après le BEPC (${lieux.etablissements} lieux de formation, ` +
      `${lieux.offres} offres), ${GUIDE.filieres.length} du supérieur ` +
      `(${GUIDE.etablissements.length} établissements, guide MESRS) ; ${obsoletesSupprimees}/${obsoletes.length} ancienne(s) ` +
      `filière(s) du supérieur supprimée(s), ${retireesSupprimees}/${retirees.length} fiche(s) retirée(s) du référentiel, ` +
      `${demoSupprimees} filière(s) de démo supprimée(s)`,
  );
}

/**
 * Secondaire technique : lieux de formation d'après les répertoires officiels des lycées, complétés des
 * écoles des métiers citées par le catalogue des nouveaux métiers. Toute spécialité, fiche ou école sans
 * correspondance arrête le seed : une offre officielle n'est jamais ignorée en silence.
 */
async function rattacherLieuxDeFormation() {
  const codesReferentiel = new Set(REFERENTIEL_FILIERES.map((f) => f.code));
  const inconnus = [...Object.values(SPECIALITES_REPERTOIRE), ...Object.values(FICHES_CATALOGUE), ...Object.keys(FICHES_METIERS)].filter(
    (c) => !codesReferentiel.has(c),
  );
  if (inconnus.length > 0) {
    throw new Error(`Correspondances vers des codes absents du référentiel : ${Array.from(new Set(inconnus)).join(', ')}`);
  }
  for (const [code, contenu] of Object.entries(FICHES_METIERS)) {
    await prisma.filiere.update({ where: { code }, data: { contenuMetier: contenu as unknown as Prisma.InputJsonValue } });
  }

  const lieux = new Map<string, string>();
  for (const e of REPERTOIRES.etablissements) {
    const data = {
      nom: e.nom,
      type: e.type,
      departement: e.departement,
      commune: e.commune,
      quartier: e.quartier,
      internat: e.internat,
      externat: e.externat,
    };
    const { id } = await prisma.etablissement.upsert({ where: { code: e.code }, update: data, create: { code: e.code, ...data } });
    lieux.set(e.code, id);
  }
  for (const e of ECOLES_METIERS) {
    const data = { nom: e.nom, type: 'ECOLE_METIER' as const };
    const { id } = await prisma.etablissement.upsert({ where: { code: e.code }, update: data, create: { code: e.code, ...data } });
    lieux.set(e.code, id);
  }

  const filieres = new Map(
    (await prisma.filiere.findMany({ where: { code: { in: Array.from(codesReferentiel) } }, select: { id: true, code: true } })).map((f) => [
      f.code as string,
      f.id,
    ]),
  );
  const offres = new Map<string, Prisma.OffreFormationCreateManyInput>();
  const ajouter = (code: string, lieu: string, duree: string | null, source: string) => {
    const filiereId = filieres.get(code);
    const etablissementId = lieux.get(lieu);
    if (!filiereId || !etablissementId) throw new Error(`Offre impossible à rattacher : ${code} à ${lieu}`);
    offres.set(`${filiereId}|${etablissementId}`, { filiereId, etablissementId, duree, source });
  };

  const specialites = new Map(Object.entries(SPECIALITES_REPERTOIRE).map(([intitule, code]) => [cleIntitule(intitule), code]));
  const sansFiche = new Set<string>();
  const utilisees = new Set<string>();
  for (const o of REPERTOIRES.offres) {
    const cle = cleIntitule(o.specialite);
    const code = specialites.get(cle);
    if (!code) {
      sansFiche.add(o.specialite);
      continue;
    }
    utilisees.add(cle);
    ajouter(code, o.etablissement, o.duree, REPERTOIRES.sources[rangSource(o.origine)].libelle);
  }
  if (sansFiche.size > 0) throw new Error(`Spécialités du répertoire sans fiche : ${Array.from(sansFiche).join(' ; ')}`);
  const inutilisees = Array.from(specialites.keys()).filter((cle) => !utilisees.has(cle));
  if (inutilisees.length > 0) throw new Error(`Correspondances absentes du répertoire (intitulé changé ?) : ${inutilisees.join(' ; ')}`);

  const ecolesCitees = new Set<string>();
  for (const m of CATALOGUE.metiers) {
    const code = FICHES_CATALOGUE[`${m.origine}-${m.numero}`];
    if (!code) throw new Error(`Fiche du catalogue sans correspondance : ${m.origine} ${m.numero} (${m.titre})`);
    for (const nom of m.etablissements ?? []) {
      const ecole = ECOLES_METIERS.find((e) => nom.includes(`(${e.sigle})`));
      if (!ecole) continue; // lycée : le répertoire fait foi
      ajouter(code, ecole.code, null, CATALOGUE.sources[rangSource(m.origine)].libelle);
      ecolesCitees.add(ecole.code);
    }
  }
  const nonCitees = ECOLES_METIERS.filter((e) => !ecolesCitees.has(e.code));
  if (nonCitees.length > 0) throw new Error(`Écoles des métiers absentes du catalogue : ${nonCitees.map((e) => e.sigle).join(', ')}`);

  // Offres entièrement reconstruites à chaque passage : le répertoire officiel fait foi
  await prisma.$transaction([prisma.offreFormation.deleteMany({}), prisma.offreFormation.createMany({ data: Array.from(offres.values()) })]);
  return { etablissements: lieux.size, offres: offres.size };
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
