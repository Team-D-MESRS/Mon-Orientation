/**
 * Informations d'édition et de contact affichées dans le pied de page et les pages d'information.
 * null = pas encore communiqué par le MESTFP : la page le signale au lieu d'afficher une valeur inventée.
 */
export const SITE = {
  editeur: "Ministère de l'Enseignement Secondaire, Technique et de la Formation Professionnelle (MESTFP)",
  directeurPublication: null as string | null,
  hebergeur: null as string | null,
  contact: {
    email: null as string | null,
    telephone: null as string | null,
    adresse: null as string | null,
  },
  /** Contact du délégué à la protection des données */
  delegueDonnees: null as string | null,
  /** Durée de conservation des dossiers et des échanges avec le conseiller */
  dureeConservation: null as string | null,
  miseAJour: '14 septembre 2026',
};

/** Sites officiels liés (adresses vérifiées le 14/09/2026). */
export const LIENS_EXTERNES = {
  mestfp: 'https://www.enseignementsecondaire.gouv.bj',
  educmaster: 'https://www.educmaster.bj',
  apresMonBac: 'https://apresmonbac.bj',
  gouvernement: 'https://www.gouv.bj',
  apdp: 'https://apdp.bj',
};
