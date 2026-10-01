import { Examen, Note, Palier, ResultatExamen } from '@prisma/client';

/**
 * Historique complet des notes d'un élève, de la 6e à son palier actuel, par onglet (une année
 * scolaire = un onglet, plus un onglet BEPC/BAC si l'examen a déjà été passé). Distinct de
 * bilan-notes.ts, qui ne regarde que l'année en cours (+ l'historique en interne, pour le seul
 * calcul d'aisance par matière) : ici, tout l'historique est exposé tel quel au frontend.
 *
 * Le palier (6e à Terminale) n'est pas stocké sur chaque Note — seul le palier ACTUEL de l'élève
 * l'est (Apprenant.palier). On retrouve donc l'année scolaire de chaque palier passé en comptant à
 * rebours depuis l'année scolaire la plus récente connue (la même convention que bilanNotes : le
 * plus grand anneeScolaire présent dans les notes, pas la date du jour — un élève sans aucune note
 * encore synchronisée n'a pas d'historique à construire).
 */

/** 6e et 5e n'existent pas dans l'enum Palier (aucune filière ni vœu ne les concerne) : cette
 * séquence est uniquement un repère d'affichage pour l'historique, jamais stockée. */
const SEQUENCE_PALIERS = ['SIXIEME', 'CINQUIEME', 'QUATRIEME', 'TROISIEME', 'SECONDE', 'PREMIERE', 'TERMINALE'] as const;
type CodePalierHistorique = (typeof SEQUENCE_PALIERS)[number];

const LABELS: Record<CodePalierHistorique, string> = {
  SIXIEME: '6e',
  CINQUIEME: '5e',
  QUATRIEME: '4e',
  TROISIEME: '3e',
  SECONDE: '2nde',
  PREMIERE: '1re',
  TERMINALE: 'Tle',
};

const LABELS_EXAMEN: Record<Examen, string> = { BEPC: 'BEPC', BAC: 'BAC' };

export interface MatiereHistorique {
  matiere: string;
  moyenne: number;
  notes: { periode: number; note: number }[];
}

export interface EntreeHistorique {
  cle: string;
  titre: string;
  type: 'annee' | 'examen';
  anneeScolaire: string | null;
  matieres: MatiereHistorique[];
  moyenneGenerale: number | null;
  /** Nombre de périodes distinctes présentes pour cette année (2 = semestres, 3 = trimestres, selon
   * ce que l'établissement a transmis — jamais supposé fixe) ; 0 pour un onglet d'examen. */
  nombrePeriodes: number;
}

const moyenne = (valeurs: number[]) => (valeurs.length ? valeurs.reduce((a, b) => a + b, 0) / valeurs.length : 0);
const arrondi = (valeur: number) => Math.round(valeur * 100) / 100;

/** "2025-2026" → 2025. Format toujours "AAAA-AAAA" (seed, puis EducMaster réel plus tard). */
const anneeDebut = (anneeScolaire: string) => parseInt(anneeScolaire.slice(0, 4), 10);

export function historiqueNotes(
  notes: Pick<Note, 'matiere' | 'note' | 'bareme' | 'trimestre' | 'anneeScolaire'>[],
  resultatsExamen: Pick<ResultatExamen, 'examen' | 'matiere' | 'note' | 'bareme' | 'anneeScolaire'>[],
  palierActuel: Palier | null,
): EntreeHistorique[] {
  if (!palierActuel) return [];
  const indexActuel = SEQUENCE_PALIERS.indexOf(palierActuel as CodePalierHistorique);
  if (indexActuel === -1) return [];

  // Référence pour remonter le temps : la plus récente année scolaire déjà connue dans les notes de
  // l'élève (comme bilanNotes) ; à défaut (aucune note encore reçue), rien à construire.
  const anneesConnues = notes.map((n) => n.anneeScolaire);
  if (anneesConnues.length === 0) return [];
  const anneeReference = anneeDebut(anneesConnues.sort().pop() as string);

  const parMatiereParAnnee = new Map<string, Map<string, { trimestre: number; note: number }[]>>();
  for (const n of notes) {
    const parMatiere = parMatiereParAnnee.get(n.anneeScolaire) ?? new Map();
    const liste = parMatiere.get(n.matiere) ?? [];
    liste.push({ trimestre: n.trimestre, note: arrondi((n.note / n.bareme) * 20) });
    parMatiere.set(n.matiere, liste);
    parMatiereParAnnee.set(n.anneeScolaire, parMatiere);
  }

  const parExamen = new Map<Examen, { matiere: string; note: number }[]>();
  for (const r of resultatsExamen) {
    const liste = parExamen.get(r.examen) ?? [];
    liste.push({ matiere: r.matiere, note: arrondi((r.note / r.bareme) * 20) });
    parExamen.set(r.examen, liste);
  }

  const entreeAnnee = (code: CodePalierHistorique, decalage: number): EntreeHistorique => {
    const debut = anneeReference - decalage;
    const anneeScolaire = `${debut}-${debut + 1}`;
    const parMatiere = parMatiereParAnnee.get(anneeScolaire);
    const matieres: MatiereHistorique[] = parMatiere
      ? Array.from(parMatiere.entries())
          .map(([matiere, liste]) => ({
            matiere,
            moyenne: arrondi(moyenne(liste.map((x) => x.note))),
            notes: liste.sort((a, b) => a.trimestre - b.trimestre).map((x) => ({ periode: x.trimestre, note: x.note })),
          }))
          .sort((a, b) => a.matiere.localeCompare(b.matiere))
      : [];
    const nombrePeriodes = new Set(matieres.flatMap((m) => m.notes.map((n) => n.periode))).size;
    return {
      cle: code,
      titre: LABELS[code],
      type: 'annee',
      anneeScolaire,
      matieres,
      moyenneGenerale: matieres.length ? arrondi(moyenne(matieres.map((m) => m.moyenne))) : null,
      nombrePeriodes,
    };
  };

  const entreeExamen = (examen: Examen): EntreeHistorique => {
    const liste = (parExamen.get(examen) ?? []).sort((a, b) => a.matiere.localeCompare(b.matiere));
    const matieres: MatiereHistorique[] = liste.map((x) => ({ matiere: x.matiere, moyenne: x.note, notes: [{ periode: 1, note: x.note }] }));
    return {
      cle: examen,
      titre: LABELS_EXAMEN[examen],
      type: 'examen',
      anneeScolaire: null,
      matieres,
      moyenneGenerale: matieres.length ? arrondi(moyenne(matieres.map((m) => m.moyenne))) : null,
      nombrePeriodes: 0,
    };
  };

  const entrees: EntreeHistorique[] = [];
  for (let i = 0; i <= indexActuel; i++) {
    const code = SEQUENCE_PALIERS[i];
    entrees.push(entreeAnnee(code, indexActuel - i));
    if (code === 'TROISIEME' && parExamen.has('BEPC')) entrees.push(entreeExamen('BEPC'));
    if (code === 'TERMINALE' && parExamen.has('BAC')) entrees.push(entreeExamen('BAC'));
  }
  return entrees;
}
