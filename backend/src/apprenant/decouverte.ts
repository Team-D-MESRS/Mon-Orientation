import { Domaine, estDomaine } from '../filiere/domaines';

/**
 * Questionnaire de découverte : ce que l'élève aime, envisage, ses ambitions, les qualités qu'il se
 * trouve, ses contraintes pratiques — à remplir avant de voir ses pistes (décision du 16/09/2026).
 *
 * Le contenu (intitulés, options) est un choix de l'équipe, pas une donnée officielle : 5 volets,
 * 11 questions dont deux à choix multiples riches (intérêts sur les 16 domaines, qualités sur 12
 * traits) plutôt que d'égaler mécaniquement un nombre de questions au prix d'écrans plus creux.
 */
export interface ReponsesDecouverte {
  /** Étape 1 — Ce qui te plaît */
  interets: Domaine[];
  matierePreferee: MatierePreferee | null;
  /** Étape 2 — Ce que tu envisages */
  metierEnvisage: string | null;
  apresCollege: 'GENERAL' | 'TECHNIQUE' | 'INDECIS';
  styleTravail: 'MANUEL' | 'INTELLECTUEL' | 'MIXTE';
  /** Étape 3 — Tes ambitions */
  statut: 'SALARIE' | 'ENTREPRENEUR' | 'LES_DEUX' | 'INDECIS';
  dureeEtudes: 'COURTE' | 'LONGUE' | 'PEU_IMPORTE';
  priorites: Priorite[];
  /** Étape 4 — Les qualités que tu te trouves */
  qualites: Qualite[];
  /** Étape 5 — Tes contraintes pratiques */
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

export const MATIERES_PREFEREES: MatierePreferee[] = ['Mathématiques', 'PCT', 'SVT', 'Français', 'Histoire-Géographie', 'Anglais', 'EPS', 'Arts', 'Aucune'];
export const PRIORITES: Priorite[] = ['REVENU', 'UTILITE', 'CREATIVITE', 'SECURITE', 'MOBILITE', 'PROXIMITE_FAMILLE'];
export const QUALITES: Qualite[] = [
  'MANUEL',
  'SCIENTIFIQUE',
  'CREATIF',
  'ORGANISE',
  'RELATIONNEL',
  'MINUTIEUX',
  'SPORTIF',
  'LOGIQUE',
  'BIENVEILLANT',
  'NATURE',
  'MENEUR',
  'PEDAGOGUE',
]; // ordre d'affichage

const MAX_INTERETS = 5;
const MAX_PRIORITES = 3;
const MAX_QUALITES = 5;

/** Domaines évoqués par chaque qualité auto-perçue ; une qualité peut en toucher plusieurs. */
const DOMAINES_QUALITE: Record<Qualite, Domaine[]> = {
  MANUEL: ['INDUSTRIE', 'ELECTRICITE', 'BTP'],
  SCIENTIFIQUE: ['SCIENCES'],
  CREATIF: ['ARTS', 'ARTISANAT'],
  ORGANISE: ['GESTION'],
  RELATIONNEL: ['DROIT', 'TOURISME'],
  MINUTIEUX: ['ARTISANAT', 'SANTE'],
  SPORTIF: ['SPORT'],
  LOGIQUE: ['SCIENCES', 'GESTION'],
  BIENVEILLANT: ['SANTE'],
  NATURE: ['AGRICULTURE', 'ENVIRONNEMENT'],
  MENEUR: ['GESTION', 'DROIT'],
  PEDAGOGUE: ['ENSEIGNEMENT'],
};

/** Domaines évoqués par la matière scolaire préférée, quand elle en évoque un. */
const DOMAINES_MATIERE: Partial<Record<MatierePreferee, Domaine[]>> = {
  Mathématiques: ['SCIENCES'],
  PCT: ['SCIENCES', 'INDUSTRIE'],
  SVT: ['SANTE', 'AGRICULTURE'],
  'Histoire-Géographie': ['DROIT', 'LETTRES'],
  Anglais: ['LETTRES', 'TOURISME'],
  EPS: ['SPORT'],
  Arts: ['ARTS'],
};

// Poids relatif de chaque source dans le décompte des affinités, avant normalisation
const POIDS_INTERETS = 2;
const POIDS_QUALITE = 1;
const POIDS_MATIERE = 1;

/**
 * Réduit les réponses brutes à une affinité par domaine, normalisée entre 0 (aucun signal) et 1
 * (domaine le plus évoqué). Les intérêts choisis directement comptent double par rapport aux
 * qualités et à la matière préférée, qui ne font qu'évoquer un domaine sans le nommer.
 */
export function affinitesDomaines(reponses: ReponsesDecouverte): Partial<Record<Domaine, number>> {
  const comptes = new Map<Domaine, number>();
  const ajouter = (domaines: Domaine[], poids: number) => {
    for (const d of domaines) comptes.set(d, (comptes.get(d) ?? 0) + poids);
  };
  ajouter(reponses.interets, POIDS_INTERETS);
  for (const q of reponses.qualites) ajouter(DOMAINES_QUALITE[q] ?? [], POIDS_QUALITE);
  if (reponses.matierePreferee) ajouter(DOMAINES_MATIERE[reponses.matierePreferee] ?? [], POIDS_MATIERE);

  const max = Math.max(0, ...comptes.values());
  if (max === 0) return {};
  return Object.fromEntries(Array.from(comptes.entries()).map(([d, n]) => [d, Math.round((n / max) * 100) / 100]));
}

/** Valide et normalise les réponses envoyées par le client ; rejette toute valeur hors énumération. */
export function validerReponses(brut: unknown): ReponsesDecouverte {
  if (typeof brut !== 'object' || brut === null) throw new Error('Réponses invalides');
  const r = brut as Record<string, unknown>;

  const interets = tableauDe(r.interets, estDomaine, 'intérêts', MAX_INTERETS);
  const qualites = tableauDe(r.qualites, (v): v is Qualite => QUALITES.includes(v as Qualite), 'qualités', MAX_QUALITES);
  const priorites = tableauDe(r.priorites, (v): v is Priorite => PRIORITES.includes(v as Priorite), 'priorités', MAX_PRIORITES);
  const matierePreferee = optionParmi(r.matierePreferee, MATIERES_PREFEREES, 'matière préférée');
  const metierEnvisage = texteCourt(r.metierEnvisage, 'métier envisagé');

  return {
    interets,
    matierePreferee,
    metierEnvisage,
    apresCollege: valeurParmi(r.apresCollege, ['GENERAL', 'TECHNIQUE', 'INDECIS'], 'après le collège'),
    styleTravail: valeurParmi(r.styleTravail, ['MANUEL', 'INTELLECTUEL', 'MIXTE'], 'style de travail'),
    statut: valeurParmi(r.statut, ['SALARIE', 'ENTREPRENEUR', 'LES_DEUX', 'INDECIS'], 'statut envisagé'),
    dureeEtudes: valeurParmi(r.dureeEtudes, ['COURTE', 'LONGUE', 'PEU_IMPORTE'], "durée d'études"),
    priorites,
    qualites,
    internat: valeurParmi(r.internat, ['OUI', 'NON', 'INDECIS'], 'internat'),
    mobiliteDepartement: valeurParmi(r.mobiliteDepartement, ['OUI', 'NON', 'INDECIS'], 'mobilité'),
  };
}

function valeurParmi<T extends string>(v: unknown, valeurs: readonly T[], champ: string): T {
  if (typeof v !== 'string' || !(valeurs as readonly string[]).includes(v)) throw new Error(`Réponse invalide pour « ${champ} »`);
  return v as T;
}

function optionParmi<T extends string>(v: unknown, valeurs: readonly T[], champ: string): T | null {
  if (v === null || v === undefined) return null;
  return valeurParmi(v, valeurs, champ);
}

function tableauDe<T>(v: unknown, estT: (x: unknown) => x is T, champ: string, max: number): T[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || !v.every(estT)) throw new Error(`Réponse invalide pour « ${champ} »`);
  if (v.length > max) throw new Error(`Au plus ${max} réponses pour « ${champ} »`);
  return Array.from(new Set(v));
}

function texteCourt(v: unknown, champ: string): string | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v !== 'string') throw new Error(`Réponse invalide pour « ${champ} »`);
  const texte = v.trim().slice(0, 200);
  return texte || null;
}
