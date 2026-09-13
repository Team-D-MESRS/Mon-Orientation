import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminHash = await bcrypt.hash('admin123', 12);
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

  const filieres = [
    {
      nom: 'Baccalauréat Général - Sciences',
      type: 'GENERALE' as any,
      description: 'Formation généraliste préparant aux études supérieures scientifiques.',
      debouches: 'Médecine, Ingénierie, Recherche scientifique',
      tauxInsertion: 65,
      bourses: true,
    },
    {
      nom: 'Baccalauréat Général - Littéraire',
      type: 'GENERALE' as any,
      description: 'Formation généraliste orientée vers les lettres, langues et sciences humaines.',
      debouches: 'Droit, Journalisme, Enseignement, Administration',
      tauxInsertion: 55,
      bourses: true,
    },
    {
      nom: 'Baccalauréat Technique - Électrotechnique',
      type: 'TECHNIQUE' as any,
      description: 'Formation technique spécialisée en électricité et systèmes automatisés.',
      debouches: 'Technicien électricien, Chef de chantier, Installateur',
      tauxInsertion: 78,
      bourses: false,
    },
    {
      nom: 'Baccalauréat Technique - Génie Civil',
      type: 'TECHNIQUE' as any,
      description: 'Formation technique en construction et travaux publics.',
      debouches: 'Technicien géomètre, Conducteur de travaux, Bâtiment',
      tauxInsertion: 75,
      bourses: false,
    },
    {
      nom: 'CAP Métallurgie',
      type: 'PROFESSIONNELLE' as any,
      description: 'Certificat d\'aptitude professionnelle en travail des métaux.',
      debouches: 'Soudeur, Métallier, Chaudronnier',
      tauxInsertion: 82,
      bourses: false,
    },
    {
      nom: 'BEP Menuiserie-Ébénisterie',
      type: 'PROFESSIONNELLE' as any,
      description: 'Brevet d\'études professionnelles en menuiserie et ébénisterie.',
      debouches: 'Menuisier, Ébéniste, Luthier',
      tauxInsertion: 80,
      bourses: false,
    },
    {
      nom: 'École de Métiers - Électricité',
      type: 'ECOLE_METIER' as any,
      description: 'Formation pratique de 2 ans en installation électrique.',
      debouches: 'Électricien qualifié, Installateur, Maintenance',
      tauxInsertion: 88,
      bourses: false,
    },
    {
      nom: 'École de Métiers - Menuiserie',
      type: 'ECOLE_METIER' as any,
      description: 'Formation pratique de 2 ans en menuiserie et bois.',
      debouches: 'Menuisier, Fabricant de meubles',
      tauxInsertion: 85,
      bourses: false,
    },
    {
      nom: 'École de Métiers - Couture',
      type: 'ECOLE_METIER' as any,
      description: 'Formation pratique de 2 ans en couture et confection.',
      debouches: 'Couturier, Modéliste, Styliste',
      tauxInsertion: 78,
      bourses: false,
    },
    {
      nom: 'Baccalauréat Technique Agricole',
      type: 'TECHNIQUE_AGRICOLE' as any,
      description: 'Formation technique en agriculture moderne et élevage.',
      debouches: 'Agriculteur moderne, Chef d\'exploitation, Conseiller agricole',
      tauxInsertion: 72,
      bourses: true,
    },
  ];

  for (const f of filieres) {
    await prisma.filiere.create({ data: f });
  }

  console.log('✅ Seed terminé');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
