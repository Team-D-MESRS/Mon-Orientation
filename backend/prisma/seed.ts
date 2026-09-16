import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { REFERENTIEL_FILIERES } from './data/referentiel-filieres';
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

const GUIDE: GuideMesrs = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'guide-mesrs-2026-2027.json'), 'utf8'));
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
    };
    await prisma.filiere.upsert({
      where: { code: f.code },
      update: data,
      create: { code: f.code, ...data },
    });
  }

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
    `✅ Seed terminé : ${REFERENTIEL_FILIERES.length} filières après le BEPC, ${GUIDE.filieres.length} du supérieur ` +
      `(${GUIDE.etablissements.length} établissements, guide MESRS) ; ${obsoletesSupprimees}/${obsoletes.length} ancienne(s) ` +
      `filière(s) du supérieur supprimée(s), ${retireesSupprimees}/${retirees.length} fiche(s) retirée(s) du référentiel, ` +
      `${demoSupprimees} filière(s) de démo supprimée(s)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
