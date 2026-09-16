import { Injectable, NotFoundException } from '@nestjs/common';
import type { FunctionDeclaration } from '@google/genai';
import { NiveauAcces, TypeFiliere } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FiliereService } from '../filiere/filiere.service';
import { OrientationService } from '../orientation/orientation.service';
import { bilanNotes } from '../apprenant/bilan-notes';

/** Erreur attendue d'un outil : son message est renvoyé au modèle (tool_result en erreur). */
export class ErreurOutil extends Error {}

const lien = (id: string) => `/catalogue/${id}`;
const texte = (valeur: unknown) => (typeof valeur === 'string' ? valeur.trim() : '');

/**
 * Outils proposés au modèle (déclarations de fonctions Gemini, schémas JSON). Ordre et contenu figés.
 * Aucun outil ne prend de NIP : le dossier consulté est celui de la route, déjà contrôlée par AccesApprenantGuard.
 */
export const OUTILS_CONSEILLER: FunctionDeclaration[] = [
  {
    name: 'rechercher_filieres',
    description:
      "Recherche dans le catalogue officiel des formations. Renvoie au plus 12 formations (code, nom, type, niveau d'accès, séries admises, lien) et le nombre total de résultats.",
    parametersJsonSchema: {
      type: 'object',
      properties: {
        texte: {
          type: 'string',
          description: 'Mots à chercher dans le nom, le code, la description ou les débouchés (ex. « agriculture », « informatique », « BAC-D »)',
        },
        type: { type: 'string', enum: Object.values(TypeFiliere), description: 'Type de formation' },
        niveau: {
          type: 'string',
          enum: Object.values(NiveauAcces),
          description: 'APRES_BEPC : formations accessibles après la 3e ; APRES_BAC : après la terminale',
        },
      },
    },
  },
  {
    name: 'fiche_filiere',
    description:
      "Fiche complète d'une formation du catalogue à partir de son code : description, diplômes, métiers, débouchés, conditions d'accès, séries admises, où se former, bourses, taux d'insertion, fiabilité de la source.",
    parametersJsonSchema: {
      type: 'object',
      properties: { code: { type: 'string', description: 'Code de la formation, ex. BAC-D ou DTM-LTA-PORCINS' } },
      required: ['code'],
    },
  },
  {
    name: 'evaluer_filiere',
    description:
      "Évalue une formation précise pour l'élève avec les règles du moteur d'orientation (score sur 100 et critères), même si elle ne fait pas partie de ses propositions. À utiliser quand l'élève ou son parent envisage une autre formation.",
    parametersJsonSchema: {
      type: 'object',
      properties: { code: { type: 'string', description: 'Code de la formation à évaluer' } },
      required: ['code'],
    },
  },
];

@Injectable()
export class OutilsConseillerService {
  constructor(
    private prisma: PrismaService,
    private filieres: FiliereService,
    private orientation: OrientationService,
  ) {}

  /** Exécute un outil demandé par le modèle pour le dossier `nip` (issu de la route authentifiée, jamais du modèle). */
  async executer(nom: string, entree: unknown, nip: string): Promise<unknown> {
    const parametres = (entree ?? {}) as Record<string, unknown>;
    switch (nom) {
      case 'rechercher_filieres':
        return this.rechercher(parametres);
      case 'fiche_filiere':
        return this.fiche(texte(parametres.code));
      case 'evaluer_filiere':
        return this.evaluer(nip, texte(parametres.code));
      default:
        throw new ErreurOutil(`Outil inconnu : ${nom}`);
    }
  }

  /**
   * Contexte joint à chaque question : dossier pseudonymisé et propositions actuelles du moteur.
   * Le modèle n'a pas besoin d'appel de fonction pour les connaître, ce qui ménage le quota de requêtes.
   */
  async contexteEleve(nip: string) {
    const [dossier, propositions] = await Promise.all([this.dossier(nip), this.recommandations(nip)]);
    return { dossier, ...propositions };
  }

  private async rechercher(parametres: Record<string, unknown>) {
    const type = texte(parametres.type);
    const niveau = texte(parametres.niveau);
    const { items, total } = await this.filieres.findAll({
      search: texte(parametres.texte) || undefined,
      type: type in TypeFiliere ? (type as TypeFiliere) : undefined,
      niveau: niveau in NiveauAcces ? (niveau as NiveauAcces) : undefined,
      limit: 12,
    });
    return {
      total,
      formations: items.map((f) => ({
        code: f.code,
        nom: f.nom,
        type: f.type,
        niveauAcces: f.niveauAcces,
        seriesAdmises: f.seriesAdmises,
        lien: lien(f.id),
      })),
    };
  }

  private async fiche(code: string) {
    const f = code ? await this.filieres.findByCode(code) : null;
    if (!f) throw new ErreurOutil(`Aucune formation avec le code « ${code} ». Utilise rechercher_filieres pour trouver le bon code.`);
    const sources = (f.sources as { officielle?: boolean }[] | null) ?? [];
    return {
      code: f.code,
      nom: f.nom,
      type: f.type,
      niveauAcces: f.niveauAcces ?? 'non renseigné',
      description: f.description,
      diplomesDelivres: f.diplomesDelivres,
      metiersVises: f.metiersVises,
      debouches: f.debouches,
      // Secondaire technique : contenu détaillé des catalogues officiels des nouveaux métiers (DTM),
      // à préférer à metiersVises/debouches quand il est présent (missions, compétences, débouchés détaillés…)
      contenuMetier: f.contenuMetier ?? undefined,
      conditionsAcces: f.conditionsAcces ?? 'non renseignées',
      seriesAdmises: f.seriesAdmises,
      // Supérieur : données du guide officiel du MESRS (null pour les formations après le BEPC)
      modeEntree: f.modeEntree,
      seriesRecommandees: f.seriesRecommandees,
      matieresClassement: f.matieresClassement,
      placesAvecBourse: f.quotaBourses,
      aidesOuPlacesPartiellementPayantes: f.quotaAides,
      // Lieux officiels (répertoires des lycées, écoles des métiers) ; ouSeFormer n'en est qu'une précision
      lieuxDeFormation: f.offres.map(({ etablissement: e }) => ({
        etablissement: e.nom,
        commune: e.commune ?? 'implantation non précisée',
        departement: e.departement ?? 'non précisé',
        internat: e.internat ?? 'non précisé',
      })),
      ouSeFormer: f.ouSeFormer ?? (f.offres.length > 0 ? null : 'non renseigné'),
      bourses: f.bourses ?? 'non renseigné',
      tauxInsertion: f.tauxInsertion ?? 'aucune donnée publique',
      sourceOfficielle: sources.some((s) => s.officielle),
      lien: lien(f.id),
    };
  }

  /** Dossier pseudonymisé : ni nom, ni NIP, ni date de naissance, ni commune, ni motivation écrite. */
  private async dossier(nip: string) {
    const filiereResumee = { select: { id: true, code: true, nom: true } };
    const apprenant = await this.prisma.apprenant.findUnique({
      where: { nip },
      select: {
        palier: true,
        serie: true,
        departement: true,
        notes: true,
        preferences: {
          select: { palier: true, valideParent: true, filiere1: filiereResumee, filiere2: filiereResumee, filiere3: filiereResumee },
        },
      },
    });
    if (!apprenant) throw new ErreurOutil('Dossier introuvable.');

    const bilan = bilanNotes(apprenant.notes);
    const voeux = apprenant.preferences.find((p) => p.palier === apprenant.palier);
    return {
      classe: apprenant.palier ?? 'non renseignée',
      serie: apprenant.serie,
      departement: apprenant.departement,
      anneeScolaire: bilan.anneeScolaire,
      moyenneGenerale: bilan.moyenneGenerale,
      moyennesParMatiere: bilan.matieres.map((m) => ({ matiere: m.matiere, moyenne: m.moyenne })),
      pointsForts: bilan.forces,
      aRenforcer: bilan.aAmeliorer,
      saisieDesVoeux:
        apprenant.palier === 'TROISIEME' || apprenant.palier === 'TERMINALE'
          ? 'ouverte à ce niveau'
          : 'pas à ce niveau (elle a lieu en 3e et en terminale)',
      voeux: voeux
        ? [voeux.filiere1, voeux.filiere2, voeux.filiere3]
            .map((f, i) => (f ? { rang: i + 1, code: f.code, nom: f.nom, lien: lien(f.id) } : null))
            .filter((v) => v !== null)
        : [],
      voeuxValidesParLeParent: voeux ? voeux.valideParent : null,
    };
  }

  private async recommandations(nip: string) {
    let recommandations = await this.orientation.getRecommandations(nip);
    if (recommandations.length === 0) {
      recommandations = await this.orientation.calculerRecommandations(nip);
    }
    return {
      propositions: recommandations.map((r, i) => ({
        rang: i + 1,
        code: r.filiere.code,
        nom: r.filiere.nom,
        lien: lien(r.filiere.id),
        score: Math.round(r.score),
        criteres: r.criteres,
      })),
    };
  }

  private async evaluer(nip: string, code: string) {
    if (!code) throw new ErreurOutil('Le code de la formation est obligatoire.');
    let resultat: Awaited<ReturnType<OrientationService['evaluerFiliere']>>;
    try {
      resultat = await this.orientation.evaluerFiliere(nip, code);
    } catch (err) {
      if (err instanceof NotFoundException) throw new ErreurOutil(`Aucune formation avec le code « ${code} ».`);
      throw err;
    }

    const { filiere } = resultat;
    const formation = { code: filiere.code, nom: filiere.nom, lien: lien(filiere.id) };
    if (!resultat.accessibleAuNiveauActuel) {
      const moment =
        filiere.niveauAcces === 'APRES_BAC' ? 'après le bac' : filiere.niveauAcces === 'APRES_BEPC' ? 'après le BEPC' : null;
      return {
        ...formation,
        accessibleAuNiveauActuel: false,
        explication: moment
          ? `Cette formation se prépare ${moment} : le moteur ne l'évalue pas au niveau actuel de l'élève.`
          : "Le niveau d'accès de cette formation n'est pas encore renseigné dans le catalogue : le moteur ne peut pas l'évaluer.",
      };
    }
    return {
      ...formation,
      score: resultat.score,
      accessibleAvecLaSerieDeLEleve: resultat.admissible,
      voeuDeLEleve: resultat.rangVoeu,
      criteres: resultat.criteres,
    };
  }
}
