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
    const [totalApprenants, totalEtablissements] = await Promise.all([
      this.prisma.apprenant.count({ where: { departement } }),
      this.prisma.etablissement.count({ where: { departement } }),
    ]);

    return { departement, totalApprenants, totalEtablissements };
  }

  /**
   * Un département par ligne, pour le tableau du tableau de bord DGES. Les établissements sans département
   * connu (répertoires muets sur ce point pour certaines écoles des métiers) ne sont comptés dans aucune ligne,
   * mais restent dans le total national de `getStatsNationales`.
   */
  async getStatsDepartements() {
    const [apprenants, etablissements] = await Promise.all([
      this.prisma.apprenant.groupBy({ by: ['departement'], _count: true }),
      this.prisma.etablissement.groupBy({ by: ['departement'], where: { departement: { not: null } }, _count: true }),
    ]);

    const parDepartement = new Map<string, { apprenants: number; etablissements: number }>();
    for (const a of apprenants) parDepartement.set(a.departement, { apprenants: a._count, etablissements: 0 });
    for (const e of etablissements) {
      const departement = e.departement as string;
      const entree = parDepartement.get(departement) ?? { apprenants: 0, etablissements: 0 };
      entree.etablissements = e._count;
      parDepartement.set(departement, entree);
    }

    return [...parDepartement.entries()]
      .map(([departement, compte]) => ({ departement, ...compte }))
      .sort((a, b) => a.departement.localeCompare(b.departement, 'fr'));
  }

  async getStatsFiliere() {
    return this.prisma.filiere.groupBy({
      by: ['type'],
      _count: true,
      _avg: { tauxInsertion: true },
    });
  }
}
