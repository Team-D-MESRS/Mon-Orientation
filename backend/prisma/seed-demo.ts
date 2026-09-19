/**
 * Données de démonstration : élèves et notes fictifs, comptes de test, en attendant EducMaster.
 * Interdit en production (les mots de passe sont publics). Usage : npm run prisma:seed:demo
 */
import { Palier, Prisma, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ReponsesDecouverte, affinitesDomaines } from '../src/apprenant/decouverte';
import { ReponseRiasec } from '../src/apprenant/riasec';

/** Construit les 36 réponses du test RIASEC à partir d'une valeur par dimension (1 à 5). */
function reponsesRiasec(valeurs: Record<'R' | 'I' | 'A' | 'S' | 'E' | 'C', [number, number, number, number, number, number]>): ReponseRiasec[] {
  const prefixes = { R: 'r', I: 'i', A: 'a', S: 's', E: 'e', C: 'c' } as const;
  return (Object.keys(valeurs) as (keyof typeof valeurs)[]).flatMap((code) =>
    valeurs[code].map((valeur, i) => ({ id: `${prefixes[code]}${i + 1}`, valeur: valeur as ReponseRiasec['valeur'] })),
  );
}

const prisma = new PrismaClient();

const MOT_DE_PASSE_DEMO = 'Demo2026!';
const ANNEE_SCOLAIRE = '2025-2026';

interface EleveDemo {
  nip: string;
  /** Numéro EducMaster fictif : accepté à l'identification au même titre que le NIP. */
  numeroEducmaster: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: 'F' | 'M';
  departement: string;
  commune: string;
  palier: Palier;
  serie?: string;
  /**
   * Crée aussi le compte élève. Sans compte, il est créé à la première identification — le mot de
   * passe fictif étant alors la date de naissance —, ce qui exerce ce chemin en démonstration.
   */
  avecCompte: boolean;
  /** Notes des trois trimestres, sur 20 */
  notes: Record<string, [number, number, number]>;
  /**
   * Questionnaire de découverte déjà rempli, pour Fatou et Koffi : depuis le 16/09, les pistes ne
   * sont visibles côté frontend qu'une fois le questionnaire rempli, et les suites existantes
   * naviguent jusqu'aux recommandations de ces deux élèves. Absent pour Adama (chemin « pas encore
   * rempli », compte créé à la 1re identification) et pour Rachidath/Idrissa (18/09 : comptes dédiés
   * à la démo du mur et du test RIASEC dès la connexion, un par niveau de vœux — 3e et Terminale —
   * pour ne pas perturber Fatou/Koffi, dont les suites de tests dépendent d'un profil déjà rempli).
   */
  decouverte?: ReponsesDecouverte;
}

const ELEVES: EleveDemo[] = [
  {
    nip: 'DEMO-3E-0001',
    numeroEducmaster: 'EM-2026-00031',
    nom: 'Dossou',
    prenom: 'Fatou',
    dateNaissance: '2011-03-12',
    sexe: 'F',
    departement: 'Littoral',
    commune: 'Cotonou',
    palier: 'TROISIEME',
    avecCompte: true,
    notes: {
      Mathématiques: [15, 16, 15.5],
      PCT: [14, 15, 14.5],
      SVT: [13, 13.5, 14],
      Français: [12, 11.5, 12],
      Anglais: [11, 12, 12.5],
      'Histoire-Géographie': [11, 10.5, 11],
      EPS: [15, 14, 15],
    },
    decouverte: {
      // Dominante Réaliste/Investigateur : cohérent avec l'électricité, le numérique et le style manuel.
      riasec: reponsesRiasec({
        R: [5, 5, 5, 4, 5, 5],
        I: [4, 5, 4, 4, 4, 5],
        A: [2, 2, 3, 2, 2, 3],
        S: [3, 3, 2, 3, 3, 3],
        E: [2, 3, 2, 2, 3, 2],
        C: [4, 3, 4, 3, 3, 3],
      }),
      metierEnvisage: "Technicienne en électricité ou en énergies renouvelables",
      apresCollege: 'TECHNIQUE',
      styleTravail: 'MANUEL',
      statut: 'SALARIE',
      dureeEtudes: 'COURTE',
      priorites: ['REVENU', 'SECURITE'],
      internat: 'NON',
      mobiliteDepartement: 'NON',
    },
  },
  {
    nip: 'DEMO-TLE-0001',
    numeroEducmaster: 'EM-2026-00047',
    nom: 'Agossou',
    prenom: 'Koffi',
    dateNaissance: '2008-09-30',
    sexe: 'M',
    departement: 'Borgou',
    commune: 'Parakou',
    palier: 'TERMINALE',
    serie: 'D',
    avecCompte: true,
    notes: {
      Mathématiques: [12, 13, 12.5],
      PCT: [14, 14.5, 15],
      SVT: [15, 16, 15.5],
      Français: [11, 11.5, 12],
      Philosophie: [10, 11, 10.5],
      Anglais: [12, 12, 13],
      'Histoire-Géographie': [11, 12, 11.5],
      EPS: [14, 15, 14],
    },
    decouverte: {
      // Dominante Social (santé), avec un Investigateur (sciences) marqué juste derrière : cohérent
      // avec le métier envisagé (infirmier) et le style intellectuel. Santé doit rester le domaine
      // dominant unique — Social légèrement au-dessus d'Investigateur, pas à égalité.
      riasec: reponsesRiasec({
        S: [5, 5, 5, 4, 5, 4],
        I: [4, 4, 5, 4, 4, 4],
        R: [2, 2, 2, 3, 2, 2],
        A: [2, 3, 2, 2, 2, 3],
        E: [2, 2, 3, 2, 2, 2],
        C: [4, 3, 4, 4, 3, 3],
      }),
      metierEnvisage: 'Infirmier ou technicien de laboratoire médical',
      apresCollege: 'GENERAL',
      styleTravail: 'INTELLECTUEL',
      statut: 'SALARIE',
      dureeEtudes: 'LONGUE',
      priorites: ['UTILITE', 'SECURITE'],
      internat: 'OUI',
      mobiliteDepartement: 'OUI',
    },
  },
  {
    nip: 'DEMO-3E-0002',
    numeroEducmaster: 'EM-2026-00058',
    nom: 'Alao',
    prenom: 'Rachidath',
    dateNaissance: '2011-05-20',
    sexe: 'F',
    departement: 'Ouémé',
    commune: 'Porto-Novo',
    palier: 'TROISIEME',
    avecCompte: true,
    notes: {
      Mathématiques: [13, 12.5, 13],
      PCT: [12, 12, 12.5],
      SVT: [14, 14.5, 14],
      Français: [13, 13, 13.5],
      Anglais: [12, 12.5, 12],
      'Histoire-Géographie': [13, 12.5, 13],
      EPS: [14, 14, 14.5],
    },
    // Pas de découverte : compte dédié à la démo du mur (redirection dès la connexion) et du test
    // RIASEC pour un niveau 3e — voir le commentaire du champ decouverte ci-dessus.
  },
  {
    nip: 'DEMO-TLE-0002',
    numeroEducmaster: 'EM-2026-00061',
    nom: 'Chitou',
    prenom: 'Idrissa',
    dateNaissance: '2008-11-02',
    sexe: 'M',
    departement: 'Atacora',
    commune: 'Natitingou',
    palier: 'TERMINALE',
    serie: 'E',
    avecCompte: true,
    notes: {
      Mathématiques: [15, 15.5, 16],
      PCT: [14, 14, 15],
      SVT: [12, 12.5, 12],
      Français: [11, 11.5, 12],
      Philosophie: [10, 10.5, 11],
      Anglais: [12, 12, 12.5],
      'Histoire-Géographie': [11, 11, 11.5],
      EPS: [13, 14, 13.5],
    },
    // Pas de découverte : même rôle que Rachidath, pour un niveau Terminale (vœux du supérieur,
    // 3 choix libres, plutôt que la fiche unique d'inscription de la 3e).
  },
  {
    nip: 'DEMO-1RE-0001',
    numeroEducmaster: 'EM-2026-00064',
    nom: 'Dossou',
    prenom: 'Chimène',
    dateNaissance: '2010-02-14',
    sexe: 'F',
    departement: 'Littoral',
    commune: 'Cotonou',
    palier: 'PREMIERE',
    serie: 'C',
    avecCompte: true,
    notes: {
      Mathématiques: [14, 14.5, 15],
      PCT: [13, 13, 13.5],
      SVT: [12, 12.5, 12],
      Français: [12, 12, 12.5],
      Philosophie: [11, 11.5, 12],
      Anglais: [13, 13, 13.5],
      'Histoire-Géographie': [12, 12, 12.5],
      EPS: [15, 15, 15.5],
    },
    // Pas de découverte : seul palier qui n'avait pas encore de compte de démo (4e, 3e et Terminale
    // sont déjà couverts). Sœur de Fatou (même nom, même père) : rattachée au compte parent Moussa
    // en 2e enfant, pour démontrer côté parent le contraste entre un enfant qui a déjà tout fait
    // (Fatou : vœux validés) et un autre qui n'a pas encore répondu au questionnaire.
  },
  {
    nip: 'DEMO-4E-0002',
    numeroEducmaster: 'EM-2026-00067',
    nom: 'Zannou',
    prenom: 'Serge',
    dateNaissance: '2012-04-03',
    sexe: 'M',
    departement: 'Plateau',
    commune: 'Pobè',
    palier: 'QUATRIEME',
    avecCompte: true,
    notes: {
      Mathématiques: [12, 12.5, 12],
      PCT: [11, 11, 11.5],
      SVT: [13, 13.5, 13],
      Français: [12, 12, 12.5],
      Anglais: [11, 11.5, 11],
      'Histoire-Géographie': [12, 12.5, 12],
      EPS: [15, 14.5, 15],
    },
    // Pas de découverte : même rôle qu'Adama (démo du mur en 4e), mais avec un compte déjà créé —
    // connexion directe au mot de passe de démo, sans passer par le chemin « 1re identification
    // avec la date de naissance », plus rapide pour une démonstration en direct.
  },
  {
    nip: 'DEMO-4E-0001',
    numeroEducmaster: 'EM-2026-00052',
    nom: 'Hounkpatin',
    prenom: 'Adama',
    dateNaissance: '2012-07-08',
    sexe: 'M',
    departement: 'Zou',
    commune: 'Abomey',
    palier: 'QUATRIEME',
    avecCompte: false,
    notes: {
      Mathématiques: [11, 12, 11.5],
      PCT: [12, 11, 12],
      SVT: [14, 15, 15.5],
      Français: [13, 12.5, 13],
      Anglais: [12, 13, 12],
      'Histoire-Géographie': [14, 13.5, 14],
      EPS: [16, 15, 16],
    },
  },
];

const COMPTES: { email: string; nom: string; prenom: string; role: Role; enfants?: { nip: string; relation: string }[] }[] = [
  {
    email: 'parent.demo@monorientation.bj',
    nom: 'Dossou',
    prenom: 'Moussa',
    role: 'PARENT',
    // Deux enfants : Fatou (vœux déjà validés) et Chimène (n'a pas encore répondu au questionnaire) —
    // pour démontrer les deux côté parent sans créer un 2e compte parent.
    enfants: [
      { nip: 'DEMO-3E-0001', relation: 'Père' },
      { nip: 'DEMO-1RE-0001', relation: 'Père' },
    ],
  },
  { email: 'dges.demo@monorientation.bj', nom: 'Direction', prenom: 'DGES', role: 'DGES' },
];

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Les données de démonstration sont interdites en production');
  }
  const hash = await bcrypt.hash(MOT_DE_PASSE_DEMO, 12);

  for (const e of ELEVES) {
    const identite = {
      numeroEducmaster: e.numeroEducmaster,
      nom: e.nom,
      prenom: e.prenom,
      dateNaissance: new Date(e.dateNaissance),
      sexe: e.sexe,
      departement: e.departement,
      commune: e.commune,
      palier: e.palier,
      serie: e.serie ?? null,
    };
    await prisma.apprenant.upsert({ where: { nip: e.nip }, update: identite, create: { nip: e.nip, ...identite } });

    for (const [matiere, trimestres] of Object.entries(e.notes)) {
      for (let i = 0; i < trimestres.length; i++) {
        const cle = { apprenantNip: e.nip, matiere, trimestre: i + 1, anneeScolaire: ANNEE_SCOLAIRE };
        await prisma.note.upsert({
          where: { apprenantNip_matiere_trimestre_anneeScolaire: cle },
          update: { note: trimestres[i] },
          create: { ...cle, note: trimestres[i], bareme: 20 },
        });
      }
    }

    if (e.avecCompte) {
      const compte = await prisma.utilisateur.upsert({
        where: { nip: e.nip },
        update: {},
        create: { nip: e.nip, nom: e.nom, prenom: e.prenom, hashMotDePasse: hash, role: 'APPRENANT' },
      });
      await prisma.apprenant.update({ where: { nip: e.nip }, data: { utilisateurId: compte.id } });
    }

    if (e.decouverte) {
      const donnees = {
        reponses: e.decouverte as unknown as Prisma.InputJsonValue,
        affinites: affinitesDomaines(e.decouverte) as Prisma.InputJsonValue,
      };
      await prisma.decouverte.upsert({ where: { apprenantNip: e.nip }, update: donnees, create: { apprenantNip: e.nip, ...donnees } });
    }
  }

  for (const c of COMPTES) {
    const compte = await prisma.utilisateur.upsert({
      where: { email: c.email },
      update: {},
      create: { email: c.email, nom: c.nom, prenom: c.prenom, hashMotDePasse: hash, role: c.role },
    });
    for (const enfant of c.enfants ?? []) {
      const lien = await prisma.parentApprenant.findFirst({ where: { parentUserId: compte.id, apprenantNip: enfant.nip } });
      if (!lien) {
        await prisma.parentApprenant.create({ data: { parentUserId: compte.id, apprenantNip: enfant.nip, relation: enfant.relation } });
      }
    }
  }

  console.log(`✅ Démo : ${ELEVES.length} élèves — mot de passe des comptes : ${MOT_DE_PASSE_DEMO}`);
  for (const e of ELEVES) {
    console.log(`   ${e.avecCompte ? 'compte élève' : 'sans compte '}  NIP ${e.nip}  n° EducMaster ${e.numeroEducmaster}  ${e.prenom} ${e.nom} (${e.palier}${e.serie ? ' ' + e.serie : ''}, né(e) le ${e.dateNaissance})`);
  }
  for (const c of COMPTES) console.log(`   compte ${c.role.toLowerCase()}  ${c.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
