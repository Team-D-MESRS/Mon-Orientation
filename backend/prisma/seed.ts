import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { REFERENTIEL_FILIERES } from './data/referentiel-filieres';

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
    };
    await prisma.filiere.upsert({
      where: { code: f.code },
      update: data,
      create: { code: f.code, ...data },
    });
  }

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

  console.log(`✅ Seed terminé : ${REFERENTIEL_FILIERES.length} filières du référentiel, ${demoSupprimees} filière(s) de démo supprimée(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
