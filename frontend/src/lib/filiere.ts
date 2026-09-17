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
  | 'ARTS'
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
  | 'SPORT'
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
  /** Admission au supérieur, telle que publiée dans le guide officiel du MESRS */
  quotaBourses: number | null;
  quotaAides: number | null;
  modeEntree: string | null;
  seriesRecommandees: string | null;
  matieresClassement: string | null;
  etablissement?: { nom: string; sigle: string | null; universite: string | null } | null;
  /** Secondaire technique : établissements où la formation est ouverte (fiche détaillée seulement) */
  offres?: LieuDeFormation[];
  /** Secondaire technique : contenu des catalogues officiels des nouveaux métiers (DTM), fiche détaillée seulement */
  contenuMetier?: ContenuMetier | null;
  /** Présent quand la liste est filtrée par série de bac */
  accesSerie?: AccesSerie;
}

/** Lieu de formation d'après les répertoires officiels des lycées ou le catalogue des nouveaux métiers. */
export interface LieuDeFormation {
  duree: string | null;
  etablissement: {
    code: string;
    nom: string;
    type: string;
    /** Inconnus pour les écoles des métiers, dont l'implantation n'est pas publiée */
    departement: string | null;
    commune: string | null;
    quartier: string | null;
    internat: boolean | null;
    externat: boolean | null;
  };
}

/** « LTP Kandi (Kandi), LTP Ina (Bèbèrèkè)… » : résumé des lieux, pour les listes et la comparaison. */
export const resumeLieux = (offres: LieuDeFormation[]) =>
  offres.map(({ etablissement: e }) => (e.commune ? `${e.nom} (${e.commune})` : e.nom)).join(', ');

/** Établissement proposé au choix de la fiche unique d'inscription (contrairement à LieuDeFormation, porte un id : sert à l'enregistrer). */
export interface EtablissementPourVoeu {
  id: string;
  code: string | null;
  nom: string;
  commune: string | null;
  departement: string | null;
  internat: boolean | null;
}

/** Élément de liste, ou groupe d'éléments sous un intertitre du document officiel. */
export type ElementListe = string | { titre: string; elements: string[] };

/** Contenu d'une fiche des catalogues officiels des nouveaux métiers (DTM), tel que défini côté backend. */
export interface ContenuMetier {
  catalogue: 'LTP' | 'LTA';
  secteur?: string;
  objectif?: string;
  description: string;
  missions?: ElementListe[];
  competencesIntro?: string;
  competences: ElementListe[];
  qualites?: ElementListe[];
  debouches: ElementListe[];
  employeurs?: ElementListe[];
  secteursActivite?: ElementListe[];
  partenariatsIntro?: string;
  partenariats?: ElementListe[];
  perspectives?: ElementListe[];
  profilSortie?: string;
  diplome?: string;
  profilEntree?: string;
  duree?: string;
  ageLimite?: string;
  acces: string[];
}

/** Fiche du supérieur issue du guide du MESRS : admission détaillée (mode d'entrée, quotas, matières). */
export const avecAdmission = (f: Filiere) => f.modeEntree !== null || f.quotaBourses !== null || f.seriesRecommandees !== null;

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
  /** Départements où au moins une formation est ouverte, avec leur nombre de formations */
  departements: { nom: string; total: number }[];
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
  ARTS: 'Arts, culture et communication',
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
  SPORT: 'Sport et animation',
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
