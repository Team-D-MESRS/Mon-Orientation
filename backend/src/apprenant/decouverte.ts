import { Domaine } from '../filiere/domaines';
import { BANQUE_RIASEC, domainesDepuisRiasec, estQuestionRiasec, ReponseRiasec, scoresRiasec } from './riasec';

/**
 * Questionnaire de découverte : ce que l'élève aime (test RIASEC), envisage, ses ambitions, ses
 * contraintes pratiques — obligatoire avant de voir ses pistes, son catalogue personnalisé ou de
 * saisir ses vœux (décision du 18/09/2026, qui remplace le calcul heuristique par domaine/qualité/
 * matière du 16/09 par un vrai modèle RIASEC — voir riasec.ts et JOURNAL.md).
 */
export interface ReponsesDecouverte {
  /** Étapes 1-2 — Ce qui te plaît (test RIASEC, voir riasec.ts) */
  riasec: ReponseRiasec[];
  /** Étape 3 — Ce que tu envisages */
  metierEnvisage: string | null;
  apresCollege: 'GENERAL' | 'TECHNIQUE' | 'INDECIS';
  styleTravail: 'MANUEL' | 'INTELLECTUEL' | 'MIXTE';
  /** Étape 4 — Tes ambitions */
  statut: 'SALARIE' | 'ENTREPRENEUR' | 'LES_DEUX' | 'INDECIS';
  dureeEtudes: 'COURTE' | 'LONGUE' | 'PEU_IMPORTE';
  priorites: Priorite[];
  /** Étape 5 — Tes contraintes pratiques */
  internat: 'OUI' | 'NON' | 'INDECIS';
  mobiliteDepartement: 'OUI' | 'NON' | 'INDECIS';
}

export type Priorite = 'REVENU' | 'UTILITE' | 'CREATIVITE' | 'SECURITE' | 'MOBILITE' | 'PROXIMITE_FAMILLE';
export const PRIORITES: Priorite[] = ['REVENU', 'UTILITE', 'CREATIVITE', 'SECURITE', 'MOBILITE', 'PROXIMITE_FAMILLE'];

const MAX_PRIORITES = 3;

/**
 * Réduit les réponses au test RIASEC à une affinité par domaine, normalisée entre 0 (aucun signal)
 * et 1 (domaine le plus évoqué) — même signature et même contrat de sortie que l'ancien calcul
 * heuristique qu'elle remplace : tous les appelants (moteur d'orientation, seed de démo) continuent
 * de fonctionner sans modification.
 */
export function affinitesDomaines(reponses: ReponsesDecouverte): Partial<Record<Domaine, number>> {
  return domainesDepuisRiasec(scoresRiasec(reponses.riasec));
}

/**
 * Valide et normalise les réponses envoyées par le client ; rejette toute valeur hors énumération.
 * Le test RIASEC est obligatoire dans son intégralité (principe directeur : test bloquant) — une
 * question de la banque sans réponse fait échouer la validation plutôt que de produire un profil
 * incomplet silencieux.
 */
export function validerReponses(brut: unknown): ReponsesDecouverte {
  if (typeof brut !== 'object' || brut === null) throw new Error('Réponses invalides');
  const r = brut as Record<string, unknown>;

  const riasec = reponsesRiasecDe(r.riasec);
  const priorites = tableauDe(r.priorites, (v): v is Priorite => PRIORITES.includes(v as Priorite), 'priorités', MAX_PRIORITES);
  const metierEnvisage = texteCourt(r.metierEnvisage, 'métier envisagé');

  return {
    riasec,
    metierEnvisage,
    apresCollege: valeurParmi(r.apresCollege, ['GENERAL', 'TECHNIQUE', 'INDECIS'], 'après le collège'),
    styleTravail: valeurParmi(r.styleTravail, ['MANUEL', 'INTELLECTUEL', 'MIXTE'], 'style de travail'),
    statut: valeurParmi(r.statut, ['SALARIE', 'ENTREPRENEUR', 'LES_DEUX', 'INDECIS'], 'statut envisagé'),
    dureeEtudes: valeurParmi(r.dureeEtudes, ['COURTE', 'LONGUE', 'PEU_IMPORTE'], "durée d'études"),
    priorites,
    internat: valeurParmi(r.internat, ['OUI', 'NON', 'INDECIS'], 'internat'),
    mobiliteDepartement: valeurParmi(r.mobiliteDepartement, ['OUI', 'NON', 'INDECIS'], 'mobilité'),
  };
}

function reponsesRiasecDe(v: unknown): ReponseRiasec[] {
  if (!Array.isArray(v)) throw new Error('Réponse invalide pour « test de découverte »');
  const parId = new Map<string, ReponseRiasec>();
  for (const item of v) {
    if (typeof item !== 'object' || item === null) throw new Error('Réponse invalide pour « test de découverte »');
    const { id, valeur } = item as Record<string, unknown>;
    if (typeof id !== 'string' || !estQuestionRiasec(id)) throw new Error('Question inconnue dans le test de découverte');
    if (typeof valeur !== 'number' || !Number.isInteger(valeur) || valeur < 1 || valeur > 5) {
      throw new Error('Réponse invalide pour « test de découverte » : la valeur doit être entre 1 et 5');
    }
    parId.set(id, { id, valeur: valeur as ReponseRiasec['valeur'] });
  }
  if (parId.size < BANQUE_RIASEC.length) {
    throw new Error('Le test de découverte doit être complété en entier');
  }
  return Array.from(parId.values());
}

function valeurParmi<T extends string>(v: unknown, valeurs: readonly T[], champ: string): T {
  if (typeof v !== 'string' || !(valeurs as readonly string[]).includes(v)) throw new Error(`Réponse invalide pour « ${champ} »`);
  return v as T;
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
