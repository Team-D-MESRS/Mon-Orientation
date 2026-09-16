import { Filiere } from '@prisma/client';

/**
 * Matières déterminantes et seuil d'accès de chaque filière, utilisés par le moteur d'orientation.
 *
 * Première version déduite des intitulés de séries et des conditions publiées (ex. « au moins
 * 12/20 dans les matières de spécialité » pour le bac technique) : à faire valider par les
 * conseillers d'orientation de la DGES.
 */
export interface ProfilFiliere {
  matieresCles: string[];
  seuil?: number;
}

const SCIENCES = ['Mathématiques', 'PCT'];
const VIVANT = ['SVT', 'PCT'];

const PROFILS: [RegExp, ProfilFiliere][] = [
  [/^BAC-A[12]$/, { matieresCles: ['Français', 'Anglais', 'Histoire-Géographie'] }],
  [/^BAC-B$/, { matieresCles: ['Histoire-Géographie', 'Français', 'Mathématiques'] }],
  [/^BAC-C$/, { matieresCles: SCIENCES }],
  [/^BAC-D$/, { matieresCles: ['SVT', 'PCT', 'Mathématiques'] }],
  [/^BAC-(E|F[1-4])$/, { matieresCles: SCIENCES, seuil: 12 }],
  [/^BAC-G2$/, { matieresCles: ['Mathématiques', 'Français'], seuil: 12 }],
  [/^BAC-G[13]$/, { matieresCles: ['Français', 'Anglais'], seuil: 12 }],
  [/^BAC-EA$/, { matieresCles: VIVANT, seuil: 12 }],
  [/^DT-MODE$/, { matieresCles: [] }],
  [/^DT-/, { matieresCles: SCIENCES }],
  [/^DTM-LTP-/, { matieresCles: SCIENCES, seuil: 10 }],
  [/^DTM-LTA-/, { matieresCles: VIVANT, seuil: 10 }],
  [/^DEAT$/, { matieresCles: VIVANT }],
  [/^EFMS-/, { matieresCles: ['SVT', 'Français'] }],
];

/**
 * Au supérieur, les matières clés sont celles du classement officiel (guide du MESRS, champ matieresCles).
 * Le guide pondère ces matières par les coefficients du bac de chaque série, qu'il ne publie pas :
 * le moteur les compte à parts égales. Sans matière connue, la moyenne générale compte pour moitié.
 */
export function profilFiliere(filiere: Pick<Filiere, 'code' | 'matieresCles'>): ProfilFiliere {
  const officielles = Array.isArray(filiere.matieresCles) ? (filiere.matieresCles as string[]) : [];
  if (officielles.length > 0) return { matieresCles: officielles };
  const code = filiere.code;
  return (code && PROFILS.find(([motif]) => motif.test(code))?.[1]) || { matieresCles: [] };
}

export type CompatibiliteSerie = 'admise' | 'sous_conditions' | 'non_admise' | 'inconnue';

const SERIES_TECHNIQUES = /^(E|F[1-4]|G[1-3]|EA|DT|DEAT)$/;

/** Compare la série de l'élève aux séries admises d'une filière du supérieur. */
export function compatibiliteSerie(seriesAdmises: string[] | null, serie: string | null): CompatibiliteSerie {
  if (!seriesAdmises || seriesAdmises.length === 0 || !serie) return 'inconnue';
  if (seriesAdmises.includes(serie) || seriesAdmises.includes('Toutes séries')) return 'admise';
  if (seriesAdmises.some((s) => s.startsWith('Baccalauréats techniques'))) {
    return SERIES_TECHNIQUES.test(serie) ? 'admise' : 'non_admise';
  }
  if (seriesAdmises.some((s) => s.startsWith('Autres séries'))) return 'sous_conditions';
  return 'non_admise';
}
