export type TypeFiliere =
  | 'GENERALE'
  | 'TECHNIQUE'
  | 'TECHNIQUE_AGRICOLE'
  | 'PROFESSIONNELLE'
  | 'ECOLE_METIER'
  | 'UNIVERSITE';

export type NiveauAcces = 'APRES_BEPC' | 'APRES_BAC';

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
}

export interface PageFilieres {
  items: Filiere[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

export const aUneSourceOfficielle = (filiere: Filiere) => filiere.sources?.some((s) => s.officielle) ?? false;
