import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getStatsNationales() {
    const [totalApprenants, totalFiliere, totalEtablissements] = await Promise.all([
      this.prisma.apprenant.count(),
      this.prisma.filiere.count({ where: { masquee: false } }),
      this.prisma.etablissement.count(),
    ]);

    const repartitionType = await this.prisma.filiere.groupBy({
      by: ['type'],
      where: { masquee: false },
      _count: true,
    });

    return {
      totalApprenants,
      totalFiliere,
      totalEtablissements,
      repartitionType,
    };
  }

  async getStatsDepartement(departement: string) {
    const apprenants = await this.prisma.apprenant.findMany({
      where: { departement },
    });

    const etablissements = await this.prisma.etablissement.findMany({
      where: { departement },
    });

    return {
      departement,
      totalApprenants: apprenants.length,
      totalEtablissements: etablissements.length,
    };
  }

  async getStatsFiliere() {
    return this.prisma.filiere.groupBy({
      by: ['type'],
      _count: true,
      _avg: { tauxInsertion: true },
    });
  }
}
