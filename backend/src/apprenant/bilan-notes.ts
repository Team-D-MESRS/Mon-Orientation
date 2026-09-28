import { Note } from '@prisma/client';

export interface MoyenneMatiere {
  matiere: string;
  moyenne: number;
  notes: { trimestre: number; note: number }[];
}

export interface BilanNotes {
  anneeScolaire: string | null;
  moyenneGenerale: number | null;
  matieres: MoyenneMatiere[];
  forces: string[];
  aAmeliorer: string[];
}

export const SEUIL_FORCE = 14;
export const SEUIL_FAIBLESSE = 10;

/**
 * Poids heuristiques du score d'aisance par matière (ni l'un ni l'autre dérivé d'une donnée
 * officielle — des constantes rondes, comme SEUIL_FORCE/SEUIL_FAIBLESSE) : une matière où les notes
 * varient beaucoup d'un trimestre à l'autre n'est pas encore vraiment maîtrisée même si la moyenne
 * est correcte (pénalité) ; une matière qui progresse nettement d'année en année mérite d'être
 * signalée même si le niveau actuel reste moyen (bonus).
 */
const PENALITE_INSTABILITE = 0.5;
const BONUS_TENDANCE = 0.3;

/**
 * Bilan de l'année scolaire la plus récente : moyenne par matière ramenée sur 20 et moyenne générale.
 * Moyennes non pondérées : les coefficients par série seront appliqués avec les données EducMaster.
 */
export function bilanNotes(notes: Pick<Note, 'matiere' | 'note' | 'bareme' | 'trimestre' | 'anneeScolaire'>[]): BilanNotes {
  if (notes.length === 0) {
    return { anneeScolaire: null, moyenneGenerale: null, matieres: [], forces: [], aAmeliorer: [] };
  }

  const anneeScolaire = notes.map((n) => n.anneeScolaire).sort().pop() as string;
  const parMatiere = new Map<string, { trimestre: number; note: number }[]>();
  // Historique complet (6e à la classe actuelle), pas seulement l'année en cours : sert uniquement
  // à repérer les matières où l'élève est le plus à l'aise (ci-dessous), pas à calculer la moyenne
  // générale affichée, qui reste celle de l'année en cours.
  const historiqueParMatiere = new Map<string, { anneeScolaire: string; trimestre: number; note: number }[]>();
  for (const n of notes) {
    const note20 = arrondi((n.note / n.bareme) * 20);
    const historique = historiqueParMatiere.get(n.matiere) ?? [];
    historique.push({ anneeScolaire: n.anneeScolaire, trimestre: n.trimestre, note: note20 });
    historiqueParMatiere.set(n.matiere, historique);
    if (n.anneeScolaire === anneeScolaire) {
      const liste = parMatiere.get(n.matiere) ?? [];
      liste.push({ trimestre: n.trimestre, note: note20 });
      parMatiere.set(n.matiere, liste);
    }
  }

  const matieres = Array.from(parMatiere.entries())
    .map(([matiere, liste]) => ({
      matiere,
      moyenne: arrondi(moyenne(liste.map((x) => x.note))),
      notes: liste.sort((a, b) => a.trimestre - b.trimestre),
    }))
    .sort((a, b) => b.moyenne - a.moyenne);

  // Aisance par matière : le niveau reste celui de l'année en cours (« à l'aise » se juge sur
  // aujourd'hui, pas sur une moyenne diluée par la 6e) ; stabilité (peu de variation d'un trimestre
  // à l'autre) et tendance (progression entre la 1re et la 2e moitié de l'historique) se calculent,
  // eux, sur tout l'historique disponible et viennent corriger ce niveau. Un élève qui n'a qu'une
  // seule année de notes reste couvert : tendance nulle, écart-type calculé sur les seuls trimestres
  // disponibles.
  const aisance = matieres.map(({ matiere, moyenne: niveauActuel }) => {
    const chronologique = (historiqueParMatiere.get(matiere) ?? [])
      .sort((a, b) => a.anneeScolaire.localeCompare(b.anneeScolaire) || a.trimestre - b.trimestre)
      .map((x) => x.note);
    const score = niveauActuel - PENALITE_INSTABILITE * ecartType(chronologique) + BONUS_TENDANCE * tendance(chronologique);
    return { matiere, score: arrondi(score) };
  });

  return {
    anneeScolaire,
    moyenneGenerale: arrondi(moyenne(matieres.map((m) => m.moyenne))),
    matieres,
    forces: aisance.filter((m) => m.score >= SEUIL_FORCE).map((m) => m.matiere),
    aAmeliorer: aisance.filter((m) => m.score < SEUIL_FAIBLESSE).map((m) => m.matiere),
  };
}

const moyenne = (valeurs: number[]) => valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
const arrondi = (valeur: number) => Math.round(valeur * 100) / 100;

/** Écart-type (population) : 0 si moins de deux valeurs, pas de variation à mesurer. */
function ecartType(valeurs: number[]): number {
  if (valeurs.length < 2) return 0;
  const m = moyenne(valeurs);
  return Math.sqrt(moyenne(valeurs.map((v) => (v - m) ** 2)));
}

/** Moyenne de la 2e moitié chronologique moins la 1re : positif si ça progresse, 0 si un seul point. */
function tendance(valeursChronologiques: number[]): number {
  if (valeursChronologiques.length < 2) return 0;
  const milieu = Math.ceil(valeursChronologiques.length / 2);
  return moyenne(valeursChronologiques.slice(milieu)) - moyenne(valeursChronologiques.slice(0, milieu));
}
