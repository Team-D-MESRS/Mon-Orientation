import { BadRequestException, Injectable } from '@nestjs/common';
import { TypeEvenementUsage, TypeFiliere } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DOMAINES } from '../filiere/domaines';

const DIMENSIONS_AUTORISEES = new Set<string>([...Object.values(TypeFiliere), ...Object.keys(DOMAINES)]);

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async enregistrer(type: TypeEvenementUsage, dimension?: string) {
    if (dimension && !DIMENSIONS_AUTORISEES.has(dimension)) {
      throw new BadRequestException('Dimension non autorisée. Aucun texte libre n’est collecté.');
    }

    // Un seul compteur par date UTC, type et dimension : aucune ligne par visiteur, aucun id de session,
    // aucune IP, aucune requête ou message, et aucun horodatage assez précis pour relier une action.
    const maintenant = new Date();
    const jour = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), maintenant.getUTCDate()));
    const dimensionNormalisee = dimension ?? '';
    await this.prisma.evenementUsage.upsert({
      where: { jour_type_dimension: { jour, type, dimension: dimensionNormalisee } },
      create: { jour, type, dimension: dimensionNormalisee, nombre: 1 },
      update: { nombre: { increment: 1 } },
    });
    return { enregistre: true };
  }
}
