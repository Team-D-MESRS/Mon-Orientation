import { Domaine } from '../filiere/domaines';

/**
 * Modèle RIASEC (Holland) : 6 dimensions d'intérêts professionnels, adoptées le 18/09/2026 à la
 * place du calcul heuristique par domaine/qualité/matière (décision qui annule celle du 17/09 de
 * ne pas répliquer RIASEC — voir JOURNAL.md). La banque de questions est un premier jet à faire
 * valider par un conseiller pédagogique/DGES avant mise en production, comme le reste du contenu
 * métier du projet (référentiel filières, seuils d'admission…).
 */
export type CodeRiasec = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export const CODES_RIASEC: CodeRiasec[] = ['R', 'I', 'A', 'S', 'E', 'C'];

export const LABELS_RIASEC: Record<CodeRiasec, string> = {
  R: 'Réaliste',
  I: 'Investigateur',
  A: 'Artistique',
  S: 'Social',
  E: 'Entreprenant',
  C: 'Conventionnel',
};

/** Phrase courte par code dominant, pour expliquer le résultat du test à l'élève. */
export const PHRASES_RIASEC: Record<CodeRiasec, string> = {
  R: 'tu aimes travailler avec tes mains, en plein air ou sur le terrain',
  I: 'tu aimes comprendre comment les choses fonctionnent et résoudre des problèmes concrets',
  A: 'tu aimes créer, imaginer, fabriquer des choses originales',
  S: "tu aimes être utile aux autres, expliquer, accompagner",
  E: 'tu aimes entreprendre, convaincre, organiser un projet',
  C: 'tu aimes que les choses soient bien organisées, précises, fiables',
};

export interface QuestionRiasec {
  id: string;
  texte: string;
  dimension: CodeRiasec;
}

/**
 * 36 questions (6 par dimension) : activités préférées, scénarios concrets, valeurs, aptitudes
 * perçues (formulaire non éliminatoire — il n'y a pas de bonne ou de mauvaise réponse).
 */
export const BANQUE_RIASEC: QuestionRiasec[] = [
  // Réaliste
  { id: 'r1', texte: 'Réparer un objet cassé ou une machine me plaît.', dimension: 'R' },
  { id: 'r2', texte: "Je préfère travailler dehors plutôt qu'enfermé(e) dans un bureau.", dimension: 'R' },
  { id: 'r3', texte: 'Construire ou installer quelque chose de mes mains me donne de la satisfaction.', dimension: 'R' },
  { id: 'r4', texte: "M'occuper d'animaux ou de plantes m'intéresse.", dimension: 'R' },
  { id: 'r5', texte: 'Je suis à l\'aise avec les outils et les machines.', dimension: 'R' },
  { id: 'r6', texte: 'Je préfère un travail concret, avec un résultat que je peux voir et toucher.', dimension: 'R' },
  // Investigateur
  { id: 'i1', texte: 'J\'aime comprendre pourquoi les choses fonctionnent comme elles fonctionnent.', dimension: 'I' },
  { id: 'i2', texte: 'Résoudre une panne ou un problème technique m\'intéresse.', dimension: 'I' },
  { id: 'i3', texte: 'J\'aime observer, mesurer, vérifier avant de conclure.', dimension: 'I' },
  { id: 'i4', texte: 'Les matières scientifiques (maths, physique, sciences naturelles) m\'attirent.', dimension: 'I' },
  { id: 'i5', texte: 'Face à un problème compliqué, j\'aime chercher la cause avant d\'agir.', dimension: 'I' },
  { id: 'i6', texte: 'Apprendre comment marche une nouvelle technologie me plaît.', dimension: 'I' },
  // Artistique
  { id: 'a1', texte: 'Créer, dessiner ou fabriquer quelque chose d\'original me plaît.', dimension: 'A' },
  { id: 'a2', texte: 'J\'aime imaginer de nouvelles idées, même si elles sortent de l\'ordinaire.', dimension: 'A' },
  { id: 'a3', texte: 'Je remarque facilement ce qui est beau ou bien présenté.', dimension: 'A' },
  { id: 'a4', texte: 'J\'aime décorer, embellir ou personnaliser les choses.', dimension: 'A' },
  { id: 'a5', texte: 'Écrire, chanter, dessiner ou jouer de la musique me plaît.', dimension: 'A' },
  { id: 'a6', texte: 'Je préfère un travail où je peux exprimer ma propre idée plutôt que suivre un modèle strict.', dimension: 'A' },
  // Social
  { id: 's1', texte: 'Aider quelqu\'un qui a un problème me donne satisfaction.', dimension: 'S' },
  { id: 's2', texte: 'J\'aime expliquer une chose à quelqu\'un qui ne la comprend pas encore.', dimension: 'S' },
  { id: 's3', texte: 'Prendre soin d\'une personne malade ou en difficulté ne me dérange pas.', dimension: 'S' },
  { id: 's4', texte: 'J\'aime travailler en équipe plutôt que seul(e).', dimension: 'S' },
  { id: 's5', texte: 'Écouter les problèmes des autres et essayer de les aider m\'intéresse.', dimension: 'S' },
  { id: 's6', texte: 'Accueillir, renseigner ou guider des gens me plaît.', dimension: 'S' },
  // Entreprenant
  { id: 'e1', texte: 'Convaincre les autres ou vendre une idée ne me fait pas peur.', dimension: 'E' },
  { id: 'e2', texte: 'J\'aimerais un jour diriger ma propre activité.', dimension: 'E' },
  { id: 'e3', texte: 'Prendre des décisions rapidement, même sous pression, ne me fait pas peur.', dimension: 'E' },
  { id: 'e4', texte: 'J\'aime organiser un événement ou un projet de groupe.', dimension: 'E' },
  { id: 'e5', texte: 'Négocier un prix ou défendre mon point de vue m\'intéresse.', dimension: 'E' },
  { id: 'e6', texte: 'J\'aime prendre des initiatives sans qu\'on me le demande.', dimension: 'E' },
  // Conventionnel
  { id: 'c1', texte: 'J\'aime que mes affaires et mon travail soient bien rangés et organisés.', dimension: 'C' },
  { id: 'c2', texte: 'Suivre des règles précises ne me dérange pas, ça me rassure.', dimension: 'C' },
  { id: 'c3', texte: 'Je fais attention aux détails, aux chiffres, à ne pas faire d\'erreur.', dimension: 'C' },
  { id: 'c4', texte: 'Tenir des comptes ou remplir des documents avec précision ne me dérange pas.', dimension: 'C' },
  { id: 'c5', texte: 'Je préfère des consignes claires plutôt que de tout inventer moi-même.', dimension: 'C' },
  { id: 'c6', texte: 'Classer, ranger ou organiser une liste me procure de la satisfaction.', dimension: 'C' },
];

const QUESTIONS_PAR_ID = new Map(BANQUE_RIASEC.map((q) => [q.id, q]));
export const estQuestionRiasec = (id: string): boolean => QUESTIONS_PAR_ID.has(id);

/** Réponse à une question : échelle Likert, 1 « pas du tout » à 5 « beaucoup ». */
export type ReponseRiasec = { id: string; valeur: 1 | 2 | 3 | 4 | 5 };

/**
 * Moyenne par dimension sur les items répondus, normalisée (moyenne-1)/4 → 0 à 1. Une dimension
 * sans réponse vaut 0 (pas de signal), pas une valeur neutre à 0,5 — cohérent avec le principe
 * "aucun signal = 0" déjà appliqué au calcul précédent (affinitesDomaines).
 */
export function scoresRiasec(reponses: ReponseRiasec[]): Record<CodeRiasec, number> {
  const sommes: Record<CodeRiasec, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const comptes: Record<CodeRiasec, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  for (const r of reponses) {
    const question = QUESTIONS_PAR_ID.get(r.id);
    if (!question) continue;
    sommes[question.dimension] += r.valeur;
    comptes[question.dimension] += 1;
  }
  return Object.fromEntries(
    CODES_RIASEC.map((c) => [c, comptes[c] === 0 ? 0 : Math.round(((sommes[c] / comptes[c] - 1) / 4) * 100) / 100]),
  ) as Record<CodeRiasec, number>;
}

/** Proportion de la banque à laquelle l'élève a répondu ; 1 pour un test complet. */
export function niveauConfiance(reponses: ReponseRiasec[]): number {
  const repondues = new Set(reponses.map((r) => r.id).filter(estQuestionRiasec));
  return Math.round((repondues.size / BANQUE_RIASEC.length) * 100) / 100;
}

/** Le(s) code(s) dominant(s) : le meilleur, plus un 2e si son score est à au moins `seuil` du meilleur. */
export function codesDominants(scores: Record<CodeRiasec, number>, seuil = 0.8): CodeRiasec[] {
  const tries = CODES_RIASEC.map((c) => [c, scores[c]] as const).sort((a, b) => b[1] - a[1]);
  if (tries.length === 0 || tries[0][1] <= 0) return [];
  const [meilleur, score] = tries[0];
  const second = tries[1];
  return second && second[1] >= score * seuil ? [meilleur, second[0]] : [meilleur];
}

/**
 * Table de correspondance domaine ← dimensions RIASEC, dérivée des exemples de secteurs de la
 * spécification externe du 18/09 et complétée (théorie de Holland) pour les domaines qu'elle ne
 * couvrait pas. Validée par cohérence sur les profils de démonstration existants : intérêts
 * électricité/numérique + style manuel (Fatou) → dominante R/I ; intérêts santé/sciences + style
 * intellectuel (Koffi) → dominante I/S.
 */
export const DOMAINES_PAR_RIASEC: Record<CodeRiasec, Domaine[]> = {
  R: ['AGRICULTURE', 'BTP', 'ELECTRICITE', 'INDUSTRIE', 'SPORT'],
  I: ['SCIENCES', 'NUMERIQUE', 'ENVIRONNEMENT', 'ELECTRICITE'],
  A: ['ARTS', 'ARTISANAT', 'LETTRES', 'NUMERIQUE'],
  S: ['SANTE', 'ENSEIGNEMENT', 'TOURISME', 'SPORT', 'DROIT'],
  E: ['AGRICULTURE', 'GESTION', 'DROIT'],
  C: ['GESTION'],
};

/**
 * Affinité par domaine dérivée des scores RIASEC : chaque domaine reprend le meilleur score parmi
 * les dimensions qui lui sont associées, puis tout est normalisé par le maximum global — même
 * contrat de sortie que l'ancien calcul heuristique (0 à 1, {} si aucun signal), pour rester un
 * remplacement direct côté moteur d'orientation et catalogue.
 *
 * Léger dégradé selon la position dans DOMAINES_PAR_RIASEC[code] (le domaine le plus représentatif
 * de la dimension, listé en premier, prime légèrement sur les suivants) : sans ça, plusieurs
 * domaines d'un même code se retrouvent à égalité stricte, et l'ordre alphabétique imposé par le
 * stockage JSON en base (pas l'ordre de calcul) tranche alors l'égalité à la place du contenu —
 * observé sur le profil de démonstration de Koffi (Social dominant : Santé, Droit, Enseignement,
 * Sport, Tourisme à égalité, Droit gagnant alphabétiquement au lieu de Santé).
 */
export function domainesDepuisRiasec(scores: Record<CodeRiasec, number>): Partial<Record<Domaine, number>> {
  const comptes = new Map<Domaine, number>();
  for (const code of CODES_RIASEC) {
    const score = scores[code];
    if (score <= 0) continue;
    DOMAINES_PAR_RIASEC[code].forEach((domaine, position) => {
      const poids = score * (1 - position * 0.02);
      comptes.set(domaine, Math.max(comptes.get(domaine) ?? 0, poids));
    });
  }
  const max = Math.max(0, ...comptes.values());
  if (max === 0) return {};
  return Object.fromEntries(Array.from(comptes.entries()).map(([d, n]) => [d, Math.round((n / max) * 100) / 100]));
}
