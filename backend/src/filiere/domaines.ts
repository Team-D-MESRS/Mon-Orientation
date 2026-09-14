/**
 * Domaines (secteurs d'activité) du catalogue : une filière en a au moins un.
 *
 * Classement établi par l'équipe à partir de l'intitulé et du contenu de chaque formation
 * (ce n'est pas une donnée des sources) : à faire valider par le Ministère avec le référentiel.
 */
export const DOMAINES = {
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
} as const;

export type Domaine = keyof typeof DOMAINES;

export const estDomaine = (valeur: string): valeur is Domaine => Object.prototype.hasOwnProperty.call(DOMAINES, valeur);
