import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { NiveauAcces, Palier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrientationService } from '../orientation/orientation.service';
import { bilanNotes } from './bilan-notes';
import { PreferencesDto } from './dto/preferences.dto';

/** Les vœux se saisissent en 3e (filières après le BEPC) et en Terminale (filières après le bac). */
const NIVEAU_DES_VOEUX: Partial<Record<Palier, NiveauAcces>> = {
  TROISIEME: 'APRES_BEPC',
  TERMINALE: 'APRES_BAC',
};

const FILIERES_DES_VOEUX = { filiere1: true, filiere2: true, filiere3: true } as const;

@Injectable()
export class ApprenantService {
  constructor(
    private prisma: PrismaService,
    private orientationService: OrientationService,
  ) {}

  async findByNip(nip: string) {
    const apprenant = await this.prisma.apprenant.findUnique({
      where: { nip },
      select: {
        nip: true,
        nom: true,
        prenom: true,
        dateNaissance: true,
        sexe: true,
        departement: true,
        commune: true,
        palier: true,
        serie: true,
        derniereSync: true,
        notes: true,
      },
    });
    if (!apprenant) throw new NotFoundException('Apprenant non trouvé');
    const { notes, ...profil } = apprenant;
    return { ...profil, bilan: bilanNotes(notes) };
  }

  async getNotes(nip: string) {
    return this.prisma.note.findMany({
      where: { apprenantNip: nip },
      orderBy: [{ anneeScolaire: 'desc' }, { trimestre: 'desc' }],
    });
  }

  async getParcours(nip: string) {
    return this.prisma.note.findMany({
      where: { apprenantNip: nip },
      orderBy: [{ anneeScolaire: 'asc' }, { trimestre: 'asc' }],
      distinct: ['anneeScolaire'],
    });
  }

  async getPreferences(nip: string) {
    return this.prisma.preference.findMany({
      where: { apprenantNip: nip },
      include: FILIERES_DES_VOEUX,
      orderBy: { dateSaisie: 'desc' },
    });
  }

  /** Enregistre les vœux de la classe actuelle et recalcule les recommandations. */
  async enregistrerPreferences(nip: string, dto: PreferencesDto) {
    const palier = await this.palierDeSaisie(nip);
    const niveau = NIVEAU_DES_VOEUX[palier] as NiveauAcces;

    if (dto.filiereId3 && !dto.filiereId2) {
      throw new BadRequestException('Renseigne ton 2e choix avant le 3e.');
    }
    const ids = [dto.filiereId1, dto.filiereId2, dto.filiereId3].filter((id): id is string => !!id);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Chaque vœu doit porter sur une filière différente.');
    }
    const accessibles = await this.prisma.filiere.count({ where: { id: { in: ids }, niveauAcces: niveau } });
    if (accessibles !== ids.length) {
      throw new BadRequestException(
        `Les vœux doivent porter sur des filières accessibles ${palier === 'TROISIEME' ? 'après le BEPC' : 'après le bac'}.`,
      );
    }

    const voeux = {
      filiereId1: dto.filiereId1,
      filiereId2: dto.filiereId2 ?? null,
      filiereId3: dto.filiereId3 ?? null,
      motivation: dto.motivation?.trim() || null,
    };
    const existante = await this.prisma.preference.findUnique({
      where: { apprenantNip_palier: { apprenantNip: nip, palier } },
    });
    const inchangee =
      !!existante &&
      existante.filiereId1 === voeux.filiereId1 &&
      existante.filiereId2 === voeux.filiereId2 &&
      existante.filiereId3 === voeux.filiereId3 &&
      existante.motivation === voeux.motivation;

    // Toute modification des vœux annule la validation du parent
    if (!inchangee) {
      const donnees = { ...voeux, dateSaisie: new Date(), valideParent: false, dateValidationParent: null };
      await this.prisma.preference.upsert({
        where: { apprenantNip_palier: { apprenantNip: nip, palier } },
        update: donnees,
        create: { apprenantNip: nip, palier, ...donnees },
      });
      await this.orientationService.calculerRecommandations(nip);
    }

    return this.getPreferences(nip);
  }

  async validerPreferences(nip: string) {
    const palier = await this.palierDeSaisie(nip);
    const preference = await this.prisma.preference.findUnique({
      where: { apprenantNip_palier: { apprenantNip: nip, palier } },
    });
    if (!preference) throw new NotFoundException("Aucun vœu à valider pour l'instant");

    return this.prisma.preference.update({
      where: { id: preference.id },
      data: { valideParent: true, dateValidationParent: new Date() },
      include: FILIERES_DES_VOEUX,
    });
  }

  private async palierDeSaisie(nip: string): Promise<Palier> {
    const apprenant = await this.prisma.apprenant.findUnique({ where: { nip }, select: { palier: true } });
    if (!apprenant) throw new NotFoundException('Apprenant non trouvé');
    if (!apprenant.palier || !NIVEAU_DES_VOEUX[apprenant.palier]) {
      throw new BadRequestException('La saisie des vœux se fait en 3e et en Terminale.');
    }
    return apprenant.palier;
  }
}
