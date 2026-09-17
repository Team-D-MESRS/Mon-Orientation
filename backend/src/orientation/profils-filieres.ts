import { Filiere } from '@prisma/client';

/**
 * Matières déterminantes de chaque filière, utilisées par le moteur d'orientation pour noter les
 * résultats et vérifier les conditions officielles d'admission.
 *
 * Secondaire technique et bac technologique : `conditions` reprend exactement les seuils du communiqué
 * N°0902 du MESRS (rentrées 2026-2027), tels que rendus en prose dans les constantes COND_* de
 * `prisma/data/referentiel-filieres.ts` — les deux doivent rester alignés. Une filière sans `conditions`
 * n'a pas de seuil publié : `matieresCles` sert alors seulement à noter les résultats, pas à statuer
 * sur l'admissibilité.
 */
export interface ConditionMatiere {
  /** Une matière, ou plusieurs si l'une d'elles suffit (ex. Allemand ou Espagnol) */
  matiere: string | string[];
  seuil: number;
}

export interface ProfilFiliere {
  matieresCles: string[];
  /**
   * Condition officielle d'admission : chaque entrée doit être remplie SÉPARÉMENT, avec son propre
   * seuil — ce n'est jamais une moyenne des matières. Un élève à 14/20 en Mathématiques et 7/20 en PCT
   * ne remplit pas « Mathématiques ≥ 10 et PCT ≥ 10 », même si sa moyenne des deux dépasse 10.
   */
  conditions?: ConditionMatiere[];
}

const SCIENCES = ['Mathématiques', 'PCT'];
const VIVANT = ['SVT', 'PCT'];

// Communiqué N°0902 (MESRS), rentrées 2026-2027 — voir les constantes COND_* du référentiel pour la prose.
const PAIRE_BAC_INDUSTRIEL: ConditionMatiere[] = [
  { matiere: 'Mathématiques', seuil: 12 },
  { matiere: 'PCT', seuil: 12 },
];
const PAIRE_DTM_INDUSTRIEL: ConditionMatiere[] = [
  { matiere: 'Mathématiques', seuil: 10 },
  { matiere: 'PCT', seuil: 10 },
];
const PAIRE_DTM_AGRICOLE: ConditionMatiere[] = [
  { matiere: 'Mathématiques', seuil: 10 },
  { matiere: 'SVT', seuil: 10 },
];
const PAIRE_DTM_TOURISME: ConditionMatiere[] = [
  { matiere: 'Anglais', seuil: 10 },
  { matiere: ['Allemand', 'Espagnol'], seuil: 10 },
];

const PROFILS: [RegExp, ProfilFiliere][] = [
  [/^BAC-A[12]$/, { matieresCles: ['Français', 'Anglais', 'Histoire-Géographie'] }],
  [/^BAC-B$/, { matieresCles: ['Histoire-Géographie', 'Français', 'Mathématiques'] }],
  [/^BAC-C$/, { matieresCles: SCIENCES }],
  [/^BAC-D$/, { matieresCles: ['SVT', 'PCT', 'Mathématiques'] }],
  [/^BAC-F[1-4]$/, { matieresCles: SCIENCES, conditions: PAIRE_BAC_INDUSTRIEL }],
  // Série E : absente de l'offre d'inscription 2026-2027 (communiqué N°0902), pas de seuil publié
  [/^BAC-E$/, { matieresCles: SCIENCES }],
  // Séries de gestion : le communiqué ne fixe pas de moyenne minimale (COND_BAC_GESTION)
  [/^BAC-G2$/, { matieresCles: ['Mathématiques', 'Français'] }],
  [/^BAC-G[13]$/, { matieresCles: ['Français', 'Anglais'] }],
  // Eau et Assainissement : absente de l'offre 2026-2027, pas de seuil publié
  [/^BAC-EA$/, { matieresCles: VIVANT }],
  [/^DT-MODE$/, { matieresCles: [] }],
  // DT (diplôme de technicien) : le communiqué ne publie pas de condition chiffrée pour ces filières
  [/^DT-/, { matieresCles: SCIENCES }],
  [/^DTM-LTP-ACCUEIL-TOURISTIQUE$/, { matieresCles: ['Anglais'], conditions: PAIRE_DTM_TOURISME }],
  [/^DTM-LTP-/, { matieresCles: SCIENCES, conditions: PAIRE_DTM_INDUSTRIEL }],
  [/^DTM-LTA-/, { matieresCles: VIVANT, conditions: PAIRE_DTM_AGRICOLE }],
  [/^DEAT$/, { matieresCles: VIVANT }],
  [/^EFMS-/, { matieresCles: ['SVT', 'Français'] }],
];

/**
 * Au supérieur, les matières clés sont celles du classement officiel (guide du MESRS, champ matieresCles).
 * Le guide pondère ces matières par les coefficients du bac de chaque série, qu'il ne publie pas :
 * le moteur les compte à parts égales. Sans matière connue, la moyenne générale compte pour moitié.
 * Le supérieur n'a pas de condition à seuil par matière : l'admission se joue sur le classement.
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
