/**
 * Données de démonstration : élèves et notes fictifs, comptes de test, en attendant EducMaster.
 * Interdit en production (les mots de passe sont publics). Usage : npm run prisma:seed:demo
 */
import { Palier, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const MOT_DE_PASSE_DEMO = 'Demo2026!';
const ANNEE_SCOLAIRE = '2025-2026';

interface EleveDemo {
  nip: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: 'F' | 'M';
  departement: string;
  commune: string;
  palier: Palier;
  serie?: string;
  /** Crée aussi le compte élève (connexion par NIP) ; sans compte, l'élève peut s'inscrire lui-même. */
  avecCompte: boolean;
  /** Notes des trois trimestres, sur 20 */
  notes: Record<string, [number, number, number]>;
}

const ELEVES: EleveDemo[] = [
  {
    nip: 'DEMO-3E-0001',
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
  },
  {
    nip: 'DEMO-TLE-0001',
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
  },
  {
    nip: 'DEMO-4E-0001',
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
  { email: 'parent.demo@monorientation.bj', nom: 'Dossou', prenom: 'Moussa', role: 'PARENT', enfants: [{ nip: 'DEMO-3E-0001', relation: 'Père' }] },
  { email: 'dges.demo@monorientation.bj', nom: 'Direction', prenom: 'DGES', role: 'DGES' },
];

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Les données de démonstration sont interdites en production');
  }
  const hash = await bcrypt.hash(MOT_DE_PASSE_DEMO, 12);

  for (const e of ELEVES) {
    const identite = {
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
    console.log(`   ${e.avecCompte ? 'compte élève' : 'sans compte '}  NIP ${e.nip}  ${e.prenom} ${e.nom} (${e.palier}${e.serie ? ' ' + e.serie : ''}, né(e) le ${e.dateNaissance})`);
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
