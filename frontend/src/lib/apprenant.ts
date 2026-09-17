import type { Domaine, EtablissementPourVoeu, Filiere, NiveauAcces } from './filiere';

export type Palier = 'QUATRIEME' | 'TROISIEME' | 'PREMIERE' | 'TERMINALE';

export const PALIER_LABELS: Record<Palier, string> = {
  QUATRIEME: '4e',
  TROISIEME: '3e',
  PREMIERE: '1re',
  TERMINALE: 'Terminale',
};

export interface MoyenneMatiere {
  matiere: string;
  moyenne: number;
  notes: { trimestre: number; note: number }[];
}

export interface Bilan {
  anneeScolaire: string | null;
  moyenneGenerale: number | null;
  matieres: MoyenneMatiere[];
  forces: string[];
  aAmeliorer: string[];
}

export interface ProfilApprenant {
  nip: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: string;
  departement: string;
  commune: string;
  palier: Palier | null;
  serie: string | null;
  bilan: Bilan;
}

export interface Preference {
  id: string;
  palier: Palier;
  filiereId1: string | null;
  filiereId2: string | null;
  /** Terminale seulement : en 3e, la fiche unique d'inscription ne retient que 2 choix de spécialité. */
  filiereId3: string | null;
  filiere1: Filiere | null;
  filiere2: Filiere | null;
  filiere3: Filiere | null;
  /** 3e seulement : établissement demandé, qui doit dispenser les spécialités choisies. */
  etablissementId: string | null;
  etablissement: EtablissementPourVoeu | null;
  motivation: string | null;
  dateSaisie: string;
  valideParent: boolean;
  dateValidationParent: string | null;
}

/** Formation mise de côté par l'élève en parcourant le catalogue */
export interface Favori {
  filiereId: string;
  ajouteLe: string;
  filiere: Filiere;
}

export interface Critere {
  critere: 'resultats' | 'interet' | 'preference' | 'condition' | 'serie' | 'insertion';
  points: number;
  detail: string;
  alerte?: boolean;
  rang?: number;
}

export interface Recommandation {
  id: string;
  palier: Palier;
  filiereId: string;
  score: number;
  explication: string | null;
  criteres: Critere[] | null;
  dateGeneration: string;
  filiere: Filiere;
}

/**
 * Questionnaire de découverte : ce que l'élève aime, envisage, ses ambitions, les qualités qu'il se
 * trouve, ses contraintes pratiques — à remplir avant de voir ses pistes. Miroir du type backend
 * (backend/src/apprenant/decouverte.ts).
 */
export interface ReponsesDecouverte {
  interets: Domaine[];
  matierePreferee: MatierePreferee | null;
  metierEnvisage: string | null;
  apresCollege: 'GENERAL' | 'TECHNIQUE' | 'INDECIS';
  styleTravail: 'MANUEL' | 'INTELLECTUEL' | 'MIXTE';
  statut: 'SALARIE' | 'ENTREPRENEUR' | 'LES_DEUX' | 'INDECIS';
  dureeEtudes: 'COURTE' | 'LONGUE' | 'PEU_IMPORTE';
  priorites: Priorite[];
  qualites: Qualite[];
  internat: 'OUI' | 'NON' | 'INDECIS';
  mobiliteDepartement: 'OUI' | 'NON' | 'INDECIS';
}

export type MatierePreferee = 'Mathématiques' | 'PCT' | 'SVT' | 'Français' | 'Histoire-Géographie' | 'Anglais' | 'EPS' | 'Arts' | 'Aucune';
export type Priorite = 'REVENU' | 'UTILITE' | 'CREATIVITE' | 'SECURITE' | 'MOBILITE' | 'PROXIMITE_FAMILLE';
export type Qualite =
  | 'MANUEL'
  | 'SCIENTIFIQUE'
  | 'CREATIF'
  | 'ORGANISE'
  | 'RELATIONNEL'
  | 'MINUTIEUX'
  | 'SPORTIF'
  | 'LOGIQUE'
  | 'BIENVEILLANT'
  | 'NATURE'
  | 'MENEUR'
  | 'PEDAGOGUE';

export interface Decouverte {
  apprenantNip: string;
  reponses: ReponsesDecouverte;
  affinites: Partial<Record<Domaine, number>>;
  dateSaisie: string;
  updatedAt: string;
}

export const ORDINAUX = ['1er', '2e', '3e'];

/** Les vœux se saisissent en 3e (après le BEPC) et en Terminale (après le bac). */
export const palierDeSaisie = (palier: Palier | null) => palier === 'TROISIEME' || palier === 'TERMINALE';

export const niveauDuPalier = (palier: Palier): NiveauAcces =>
  palier === 'QUATRIEME' || palier === 'TROISIEME' ? 'APRES_BEPC' : 'APRES_BAC';

export const classeLisible = ({ palier, serie }: { palier: Palier | null; serie: string | null }) =>
  palier ? `${PALIER_LABELS[palier]}${serie ? ` ${serie}` : ''}` : 'Classe non renseignée';

export const noteLisible = (note: number) => note.toFixed(1).replace('.', ',');

export const dateLisible = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');
