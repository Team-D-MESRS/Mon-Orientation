export type TypeFiliere =
  | 'GENERALE'
  | 'TECHNIQUE'
  | 'TECHNIQUE_AGRICOLE'
  | 'PROFESSIONNELLE'
  | 'ECOLE_METIER'
  | 'UNIVERSITE';

export type NiveauAcces = 'APRES_BEPC' | 'APRES_BAC';

export type Domaine =
  | 'AGRICULTURE'
  | 'ARTISANAT'
  | 'BTP'
  | 'DROIT'
  | 'ELECTRICITE'
  | 'ENSEIGNEMENT'
  | 'ENVIRONNEMENT'
  | 'GESTION'
  | 'INDUSTRIE'
  | 'LETTRES'
  | 'NUMERIQUE'
  | 'SANTE'
  | 'SCIENCES'
  | 'TOURISME';

/** Accès d'une formation du supérieur pour la série de bac filtrée */
export type AccesSerie = 'ADMISE' | 'SOUS_CONDITIONS';

export interface SourceFiliere {
  libelle: string;
  url: string;
  consulteLe: string;
  officielle: boolean;
}

export interface Filiere {
  id: string;
  code: string | null;
  nom: string;
  type: TypeFiliere;
  niveauAcces: NiveauAcces | null;
  description: string | null;
  diplomesDelivres: string[] | null;
  metiersVises: string[] | null;
  debouches: string | null;
  tauxInsertion: number | null;
  conditionsAcces: string | null;
  seriesAdmises: string[] | null;
  ouSeFormer: string | null;
  bourses: boolean | null;
  sources: SourceFiliere[] | null;
  domaines: Domaine[];
  /** Présent quand la liste est filtrée par série de bac */
  accesSerie?: AccesSerie;
}

export interface PageFilieres {
  items: Filiere[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SerieBac {
  serie: string;
  libelle: string;
  type: TypeFiliere;
  filiereId: string;
}

export interface ValeursFiltres {
  domaines: { code: Domaine; libelle: string; total: number }[];
  series: SerieBac[];
}

export const TYPE_LABELS: Record<TypeFiliere, string> = {
  GENERALE: 'Général',
  TECHNIQUE: 'Technique',
  TECHNIQUE_AGRICOLE: 'Technique agricole',
  PROFESSIONNELLE: 'Professionnel',
  ECOLE_METIER: 'École des métiers',
  UNIVERSITE: 'Université',
};

export const TYPE_COLORS: Record<TypeFiliere, string> = {
  GENERALE: 'bg-blue-100 text-blue-800',
  TECHNIQUE: 'bg-purple-100 text-purple-800',
  TECHNIQUE_AGRICOLE: 'bg-yellow-100 text-yellow-800',
  PROFESSIONNELLE: 'bg-orange-100 text-orange-800',
  ECOLE_METIER: 'bg-green-100 text-green-800',
  UNIVERSITE: 'bg-sky-100 text-sky-800',
};

export const NIVEAU_LABELS: Record<NiveauAcces, string> = {
  APRES_BEPC: 'Après le BEPC (fin de 3e)',
  APRES_BAC: 'Après le bac (fin de Terminale)',
};

/** Même liste que backend/src/filiere/domaines.ts */
export const DOMAINE_LABELS: Record<Domaine, string> = {
  AGRICULTURE: 'Agriculture, élevage et pêche',
  ARTISANAT: 'Artisanat et mode',
  BTP: 'Bâtiment et travaux publics',
  DROIT: 'Droit et science politique',
  ELECTRICITE: 'Électricité, électronique et énergie',
  ENSEIGNEMENT: 'Enseignement',
  ENVIRONNEMENT: 'Eau et environnement',
  GESTION: 'Économie, gestion et commerce',
  INDUSTRIE: 'Mécanique, industrie et automobile',
  LETTRES: 'Lettres, langues et sciences humaines',
  NUMERIQUE: 'Numérique et télécommunications',
  SANTE: 'Santé et hygiène',
  SCIENCES: 'Sciences et mathématiques',
  TOURISME: 'Tourisme, hôtellerie et restauration',
};

export const aUneSourceOfficielle = (filiere: Filiere) => filiere.sources?.some((s) => s.officielle) ?? false;

/** Série délivrée par une fiche de baccalauréat (« BAC-D » → « D »), null pour les autres fiches. */
export const serieDuBac = (filiere: Pick<Filiere, 'code'>) => (filiere.code?.startsWith('BAC-') ? filiere.code.slice(4) : null);

/** Minuscules sans accents ni ligatures, pour les recherches faites dans le navigateur. */
export const normaliser = (texte: string) =>
  texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[’‘`]/g, "'")
    .toLowerCase();

/** Vrai si le texte recherché figure dans le nom, la description ou les métiers de la filière. */
export const correspond = (filiere: Filiere, recherche: string) => {
  const q = normaliser(recherche.trim());
  return !q || normaliser([filiere.nom, filiere.description ?? '', ...(filiere.metiersVises ?? [])].join(' ')).includes(q);
};

export const MAX_COMPARAISON = 3;
