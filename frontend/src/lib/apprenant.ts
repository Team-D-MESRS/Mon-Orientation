import { DOMAINE_LABELS, type Domaine, type EtablissementPourVoeu, type Filiere, type NiveauAcces } from './filiere';
import { codesDominants, LABELS_RIASEC, type ReponseRiasec, scoresRiasec } from './riasec';

export type Palier = 'QUATRIEME' | 'TROISIEME' | 'SECONDE' | 'PREMIERE' | 'TERMINALE';

export const PALIER_LABELS: Record<Palier, string> = {
  QUATRIEME: '4e',
  TROISIEME: '3e',
  SECONDE: '2nde',
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
 * Questionnaire de découverte : test RIASEC (ce qui plaît à l'élève), ce qu'il envisage, ses
 * ambitions, ses contraintes pratiques — obligatoire avant de voir ses pistes. Miroir du type
 * backend (backend/src/apprenant/decouverte.ts).
 */
export interface ReponsesDecouverte {
  riasec: ReponseRiasec[];
  metierEnvisage: string | null;
  apresCollege: 'GENERAL' | 'TECHNIQUE' | 'INDECIS';
  styleTravail: 'MANUEL' | 'INTELLECTUEL' | 'MIXTE';
  statut: 'SALARIE' | 'ENTREPRENEUR' | 'LES_DEUX' | 'INDECIS';
  dureeEtudes: 'COURTE' | 'LONGUE' | 'PEU_IMPORTE';
  priorites: Priorite[];
  internat: 'OUI' | 'NON' | 'INDECIS';
  mobiliteDepartement: 'OUI' | 'NON' | 'INDECIS';
}

export type Priorite = 'REVENU' | 'UTILITE' | 'CREATIVITE' | 'SECURITE' | 'MOBILITE' | 'PROXIMITE_FAMILLE';

export interface Decouverte {
  apprenantNip: string;
  reponses: ReponsesDecouverte;
  affinites: Partial<Record<Domaine, number>>;
  dateSaisie: string;
  updatedAt: string;
}

/** Score minimal (proportion du domaine dominant) pour citer un 2e domaine à ses côtés. */
const SEUIL_DOMAINE_SECONDAIRE = 0.8;

/** Domaine(s) au(x) score(s) le(s) plus élevé(s) ; jusqu'à 2 si le second est proche du premier. */
export function domainesDominants(affinites: Partial<Record<Domaine, number>>, seuil = SEUIL_DOMAINE_SECONDAIRE): Domaine[] {
  const entrees = (Object.entries(affinites) as [Domaine, number][]).sort((a, b) => b[1] - a[1]);
  if (entrees.length === 0 || entrees[0][1] <= 0) return [];
  const [meilleur, score] = entrees[0];
  const second = entrees[1];
  return second && second[1] >= score * seuil ? [meilleur, second[0]] : [meilleur];
}

/** Domaine dominant seul : pour un usage à valeur unique (ex. filtre catalogue, choix simple). */
export const domaineDominant = (affinites: Partial<Record<Domaine, number>>): Domaine | null => domainesDominants(affinites)[0] ?? null;

const ADJECTIF_STYLE: Record<ReponsesDecouverte['styleTravail'], string | null> = {
  MANUEL: 'manuel',
  INTELLECTUEL: 'intellectuel',
  MIXTE: null, // pas de signal net sur cet axe
};
const ADJECTIF_ORIENTATION: Record<ReponsesDecouverte['apresCollege'], string | null> = {
  TECHNIQUE: 'technique',
  GENERAL: 'général',
  INDECIS: null,
};

/**
 * Étiquette de profil lisible, dérivée du questionnaire déjà rempli : combine les codes RIASEC
 * dominants et les axes manuel/intellectuel et technique/général des réponses avec le(s) domaine(s)
 * dominant(s) des affinités. Purement présentationnel — ne change ni le calcul des affinités ni le
 * moteur d'orientation.
 */
export function etiquetteProfil(decouverte: Decouverte): string {
  const codes = codesDominants(scoresRiasec(decouverte.reponses.riasec)).map((c) => LABELS_RIASEC[c]);
  const adjectifs = [ADJECTIF_STYLE[decouverte.reponses.styleTravail], ADJECTIF_ORIENTATION[decouverte.reponses.apresCollege]].filter(
    (a): a is string => !!a,
  );
  const domaines = domainesDominants(decouverte.affinites).map((d) => DOMAINE_LABELS[d]);
  const profil = codes.length > 0 ? `Profil ${codes.join(' et ')}` : adjectifs.length > 0 ? `Profil ${adjectifs.join(' et ')}` : 'Profil';
  if (domaines.length === 0) {
    // `${profil}` peut être le seul mot « Profil » (aucun code RIASEC dominant, aucun adjectif) : une
    // phrase dédiée plutôt que de l'accoler à une suite (« Profil, intérêts encore à préciser » ne se lit
    // pas comme une phrase).
    return codes.length > 0 || adjectifs.length > 0
      ? `${profil} : les domaines qui t'intéressent le plus restent encore à préciser.`
      : "Aucun profil ne se détache encore nettement de tes réponses, et c'est normal à ce stade.";
  }
  return `${profil}, avec un intérêt marqué pour ${domaines.join(' et ')}.`;
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
