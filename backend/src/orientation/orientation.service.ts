import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Filiere, NiveauAcces, Palier, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BilanNotes, bilanNotes } from '../apprenant/bilan-notes';
import { compatibiliteSerie, profilFiliere } from './profils-filieres';

export interface Critere {
  critere: 'resultats' | 'preference' | 'condition' | 'serie' | 'insertion';
  points: number;
  detail: string;
  alerte?: boolean;
  /** Rang du vœu (1 à 3) pour le critère « preference » */
  rang?: number;
}

interface Evaluation {
  filiere: Filiere;
  score: number;
  criteres: Critere[];
  rangVoeu: number | null;
  admissible: boolean;
}

const NIVEAU_PAR_PALIER: Record<Palier, NiveauAcces> = {
  QUATRIEME: 'APRES_BEPC',
  TROISIEME: 'APRES_BEPC',
  PREMIERE: 'APRES_BAC',
  TERMINALE: 'APRES_BAC',
};

// Barème sur 100 : résultats 60, vœux 30/20/10, insertion 10 (seulement si le taux est connu)
const POIDS_RESULTATS = 60;
const POINTS_VOEUX = [30, 20, 10];
const POIDS_INSERTION = 10;
const PENALITE_SEUIL = 15;
const PENALITE_SERIE_SOUS_CONDITIONS = 10;

const NB_RECOMMANDATIONS = 5;
const MAX_PAR_FAMILLE = 2;
const ORDINAUX = ['1er', '2e', '3e'];

@Injectable()
export class OrientationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcule les recommandations pour la classe actuelle de l'élève et remplace les précédentes.
   * Le moteur propose des pistes et ne décide rien : chaque score est détaillé critère par critère.
   */
  async calculerRecommandations(nip: string) {
    const apprenant = await this.prisma.apprenant.findUnique({
      where: { nip },
      include: { notes: true, preferences: true },
    });
    if (!apprenant) throw new NotFoundException('Apprenant non trouvé');
    if (!apprenant.palier) throw new BadRequestException("La classe de l'élève n'est pas renseignée");

    const palier = apprenant.palier;
    const niveau = NIVEAU_PAR_PALIER[palier];
    const bilan = bilanNotes(apprenant.notes);
    const preference = apprenant.preferences.find((p) => p.palier === palier);
    const voeux = preference ? [preference.filiereId1, preference.filiereId2, preference.filiereId3] : [];

    const filieres = await this.prisma.filiere.findMany({ where: { niveauAcces: niveau }, orderBy: { nom: 'asc' } });
    const evaluations = filieres
      .map((f) => this.evaluer(f, bilan, voeux, apprenant.serie, niveau))
      .sort((a, b) => b.score - a.score);
    const retenues = this.selectionner(evaluations);

    await this.prisma.$transaction([
      this.prisma.recommandation.updateMany({
        where: { apprenantNip: nip, palier, active: true },
        data: { active: false },
      }),
      this.prisma.recommandation.createMany({
        data: retenues.map((e) => ({
          apprenantNip: nip,
          palier,
          filiereId: e.filiere.id,
          score: e.score,
          explication: e.criteres.map((c) => c.detail).join(' '),
          criteres: e.criteres as unknown as Prisma.InputJsonValue,
        })),
      }),
    ]);

    return this.getRecommandations(nip);
  }

  async getRecommandations(nip: string) {
    const apprenant = await this.prisma.apprenant.findUnique({ where: { nip }, select: { palier: true } });
    return this.prisma.recommandation.findMany({
      where: { apprenantNip: nip, active: true, ...(apprenant?.palier ? { palier: apprenant.palier } : {}) },
      include: { filiere: true },
      orderBy: { score: 'desc' },
    });
  }

  /**
   * Évalue une filière précise pour l'élève avec les règles du moteur, même hors de ses recommandations.
   * Sert au conseiller pédagogique quand l'élève envisage une autre formation. N'enregistre rien.
   */
  async evaluerFiliere(nip: string, code: string) {
    const apprenant = await this.prisma.apprenant.findUnique({
      where: { nip },
      include: { notes: true, preferences: true },
    });
    if (!apprenant) throw new NotFoundException('Apprenant non trouvé');
    if (!apprenant.palier) throw new BadRequestException("La classe de l'élève n'est pas renseignée");
    const filiere = await this.prisma.filiere.findUnique({ where: { code } });
    if (!filiere) throw new NotFoundException('Filière non trouvée');

    const niveau = NIVEAU_PAR_PALIER[apprenant.palier];
    if (filiere.niveauAcces !== niveau) {
      return { filiere, niveauEleve: niveau, accessibleAuNiveauActuel: false, score: null, admissible: false, rangVoeu: null, criteres: [] as Critere[] };
    }
    const preference = apprenant.preferences.find((p) => p.palier === apprenant.palier);
    const voeux = preference ? [preference.filiereId1, preference.filiereId2, preference.filiereId3] : [];
    const evaluation = this.evaluer(filiere, bilanNotes(apprenant.notes), voeux, apprenant.serie, niveau);
    return {
      filiere,
      niveauEleve: niveau,
      accessibleAuNiveauActuel: true,
      score: evaluation.score,
      admissible: evaluation.admissible,
      rangVoeu: evaluation.rangVoeu,
      criteres: evaluation.criteres,
    };
  }

  async explain(nip: string, recommandationId: string) {
    const reco = await this.prisma.recommandation.findFirst({
      where: { id: recommandationId, apprenantNip: nip },
      include: { filiere: true },
    });
    if (!reco) throw new NotFoundException('Recommandation non trouvée');
    return reco;
  }

  /** Les meilleures pistes (au plus deux par famille pour varier), puis les vœux de l'élève s'ils n'y figurent pas. */
  private selectionner(evaluations: Evaluation[]): Evaluation[] {
    const retenues: Evaluation[] = [];
    const parFamille = new Map<string, number>();
    for (const e of evaluations) {
      if (retenues.length === NB_RECOMMANDATIONS) break;
      const famille = this.famille(e.filiere);
      if (!e.admissible || (parFamille.get(famille) ?? 0) >= MAX_PAR_FAMILLE) continue;
      parFamille.set(famille, (parFamille.get(famille) ?? 0) + 1);
      retenues.push(e);
    }
    for (const e of evaluations) {
      if (e.rangVoeu !== null && !retenues.includes(e)) retenues.push(e);
    }
    return retenues;
  }

  private famille(filiere: Filiere): string {
    // Au supérieur, toutes les filières sont de type UNIVERSITE : on varie par établissement (FSS, EPAC…)
    return filiere.type === 'UNIVERSITE' ? (filiere.etablissementId ?? filiere.code?.split('-')[1] ?? filiere.id) : filiere.type;
  }

  private evaluer(
    filiere: Filiere,
    bilan: BilanNotes,
    voeux: (string | null)[],
    serie: string | null,
    niveau: NiveauAcces,
  ): Evaluation {
    const criteres: Critere[] = [];
    const profil = profilFiliere(filiere);

    const matieresCles = bilan.matieres.filter((m) => profil.matieresCles.includes(m.matiere));
    // Une seule matière clé dans les bulletins (les autres épreuves, « culture générale » ou « étude de cas », n'y figurent
    // pas) : elle est complétée par la moyenne générale, pour ne pas avantager les formations classées sur une seule matière
    const complement = matieresCles.length === 1 ? bilan.moyenneGenerale : null;
    const moyenneCles =
      matieresCles.length > 0 ? moyenne([...matieresCles.map((m) => m.moyenne), ...(complement !== null ? [complement] : [])]) : null;
    if (moyenneCles !== null) {
      const detailMatieres = matieresCles.map((m) => `${m.matiere} ${noteLisible(m.moyenne)}`).join(', ');
      criteres.push({
        critere: 'resultats',
        points: Math.round(POIDS_RESULTATS * progression(moyenneCles)),
        detail:
          complement !== null
            ? `Ta moyenne dans la seule matière clé connue (${detailMatieres}) et ta moyenne générale (${noteLisible(complement)}/20) donnent ${noteLisible(moyenneCles)}/20.`
            : `Tes moyennes dans les matières clés (${detailMatieres}) donnent ${noteLisible(moyenneCles)}/20.`,
      });
    } else if (bilan.moyenneGenerale !== null) {
      criteres.push({
        critere: 'resultats',
        points: Math.round((POIDS_RESULTATS / 2) * progression(bilan.moyenneGenerale)),
        detail: `Pas de matière clé identifiée pour cette formation : ta moyenne générale (${noteLisible(bilan.moyenneGenerale)}/20) compte pour moitié.`,
      });
    } else {
      criteres.push({ critere: 'resultats', points: 0, detail: "Aucune note disponible pour l'instant." });
    }

    const rang = voeux.indexOf(filiere.id);
    if (rang >= 0) {
      criteres.push({ critere: 'preference', points: POINTS_VOEUX[rang], rang: rang + 1, detail: `C'est ton ${ORDINAUX[rang]} choix.` });
    }

    if (profil.seuil !== undefined && moyenneCles !== null && moyenneCles < profil.seuil) {
      criteres.push({
        critere: 'condition',
        points: -PENALITE_SEUIL,
        alerte: true,
        detail: `Attention : l'accès demande au moins ${profil.seuil}/20 dans les matières de spécialité ; ta moyenne y est de ${noteLisible(moyenneCles)}/20.`,
      });
    }

    let admissible = true;
    if (niveau === 'APRES_BAC') {
      const seriesAdmises = filiere.seriesAdmises as string[] | null;
      switch (compatibiliteSerie(seriesAdmises, serie)) {
        case 'admise':
          criteres.push({ critere: 'serie', points: 0, detail: `Ta série (${serie}) est admise.` });
          break;
        case 'sous_conditions':
          criteres.push({
            critere: 'serie',
            points: -PENALITE_SERIE_SOUS_CONDITIONS,
            alerte: true,
            detail: `Ta série (${serie}) n'est admise que sous conditions : renseigne-toi auprès de l'établissement.`,
          });
          break;
        case 'non_admise':
          admissible = false;
          criteres.push({
            critere: 'serie',
            points: 0,
            alerte: true,
            detail: `Ta série (${serie}) ne fait pas partie des séries admises (${seriesAdmises?.join(', ')}).`,
          });
          break;
        default:
          criteres.push({
            critere: 'serie',
            points: 0,
            alerte: true,
            detail: serie
              ? "Séries admises non renseignées : à vérifier auprès de l'établissement."
              : "Ta série n'est pas renseignée : vérifie les séries admises.",
          });
      }
    }

    if (filiere.tauxInsertion !== null) {
      criteres.push({
        critere: 'insertion',
        points: Math.round((POIDS_INSERTION * filiere.tauxInsertion) / 100),
        detail: `Taux d'insertion : ${filiere.tauxInsertion} %.`,
      });
    }

    const total = criteres.reduce((somme, c) => somme + c.points, 0);
    return {
      filiere,
      score: admissible ? Math.max(0, Math.min(100, total)) : 0,
      criteres,
      rangVoeu: rang >= 0 ? rang + 1 : null,
      admissible,
    };
  }
}

/** 8/20 ou moins → 0, 16/20 ou plus → 1 */
const progression = (note: number) => Math.max(0, Math.min(1, (note - 8) / 8));
const moyenne = (valeurs: number[]) => valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
const noteLisible = (note: number) => note.toFixed(1).replace('.', ',');
