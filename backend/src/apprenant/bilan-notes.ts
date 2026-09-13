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
 * Bilan de l'année scolaire la plus récente : moyenne par matière ramenée sur 20 et moyenne générale.
 * Moyennes non pondérées : les coefficients par série seront appliqués avec les données EducMaster.
 */
export function bilanNotes(notes: Pick<Note, 'matiere' | 'note' | 'bareme' | 'trimestre' | 'anneeScolaire'>[]): BilanNotes {
  if (notes.length === 0) {
    return { anneeScolaire: null, moyenneGenerale: null, matieres: [], forces: [], aAmeliorer: [] };
  }

  const anneeScolaire = notes.map((n) => n.anneeScolaire).sort().pop() as string;
  const parMatiere = new Map<string, { trimestre: number; note: number }[]>();
  for (const n of notes.filter((x) => x.anneeScolaire === anneeScolaire)) {
    const liste = parMatiere.get(n.matiere) ?? [];
    liste.push({ trimestre: n.trimestre, note: arrondi((n.note / n.bareme) * 20) });
    parMatiere.set(n.matiere, liste);
  }

  const matieres = Array.from(parMatiere.entries())
    .map(([matiere, liste]) => ({
      matiere,
      moyenne: arrondi(moyenne(liste.map((x) => x.note))),
      notes: liste.sort((a, b) => a.trimestre - b.trimestre),
    }))
    .sort((a, b) => b.moyenne - a.moyenne);

  return {
    anneeScolaire,
    moyenneGenerale: arrondi(moyenne(matieres.map((m) => m.moyenne))),
    matieres,
    forces: matieres.filter((m) => m.moyenne >= SEUIL_FORCE).map((m) => m.matiere),
    aAmeliorer: matieres.filter((m) => m.moyenne < SEUIL_FAIBLESSE).map((m) => m.matiere),
  };
}

const moyenne = (valeurs: number[]) => valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
const arrondi = (valeur: number) => Math.round(valeur * 100) / 100;
