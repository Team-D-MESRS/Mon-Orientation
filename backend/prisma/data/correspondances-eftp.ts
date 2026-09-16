/**
 * Rattachement des documents officiels de la formation technique aux fiches du référentiel.
 *
 * - Lieux de formation : le répertoire des lycées (repertoires-eftp.json) fait foi ; le catalogue des
 *   nouveaux métiers (metiers-dtm.json) n'ajoute que les écoles des métiers, absentes du répertoire.
 *   Ses listes de lycées sont copiées d'un métier à l'autre au sein d'un même secteur (les quatre DTM
 *   de l'énergie portent la même liste) : elles ne sont pas reprises. Décision du 16/09/2026.
 * - Toute spécialité du répertoire, toute fiche du catalogue et toute école doit trouver ici son code :
 *   le seed s'arrête sinon, plutôt que d'ignorer une offre en silence.
 */

/** Intitulé de spécialité du répertoire (tel que mis en forme par l'extracteur) → code de fiche. */
export const SPECIALITES_REPERTOIRE: Record<string, string> = {
  // Baccalauréat technologique
  'Secrétariat (G1)': 'BAC-G1',
  'Comptabilité (G2)': 'BAC-G2',
  'Gestion commerciale (G3)': 'BAC-G3',
  'Construction mécanique (F1)': 'BAC-F1',
  'Électrotechnique (F3)': 'BAC-F3',
  'Génie civil (F4)': 'BAC-F4',
  'Eau et assainissement (EA)': 'BAC-EA',
  // Diplôme d'État (EFMS)
  "Hygiéniste d'assainissement": 'EFMS-HYGIENISTE-ASSAINISSEMENT',
  'Hygiéniste de salle': 'EFMS-HYGIENISTE-SALLES',
  // Diplôme de technicien
  "Construction d'équipements mécano-soudés (CEMS)": 'DT-MECANO-SOUDURE',
  'Métiers de la mode et du vêtement (MMV)': 'DT-MODE',
  "Programmeur système et développeur d'applications web et mobile": 'DT-DEV-WEB-MOBILE',
  'Producteur multimédia': 'DT-MULTIMEDIA',
  'Fabrication mécanique (FM)': 'DT-FABRICATION-MECANIQUE',
  // Le répertoire l'indique en DT ; le communiqué N°0902 et le catalogue en DTM, retenu (décision du 16/09/2026)
  'Tourisme (accueil touristique)': 'DTM-LTP-ACCUEIL-TOURISTIQUE',
  // DTM des lycées techniques professionnels
  "Métier d'électricité": 'DTM-LTP-ELEC-ENERGIE',
  'Énergie renouvelables (photovoltaïque)': 'DTM-LTP-ENR',
  "Froid sanitaire et conditionnement d'air": 'DTM-LTP-FROID-CLIM',
  'Maintenance électronique option multimédia': 'DTM-LTP-MAINT-MULTIMEDIA',
  'Technicien réseau et sécurité informatique': 'DTM-LTP-RESEAUX-CYBER',
  'Maintenance des voitures particulières': 'DTM-LTP-MECA-AUTO',
  'Réalisation de gros œuvre': 'DTM-LTP-GROS-OEUVRE',
  'Géomètre topographe': 'DTM-LTP-TOPOGRAPHIE',
  "Technicien d'étude en bâtiment": 'DTM-LTP-ETUDES-BATIMENT',
  'Technicien en fabrication des équipements en bois': 'DTM-LTP-BOIS',
  // DTM des lycées techniques agricoles
  'Aviculture, cuniculture et élevages non conventionnels': 'DTM-LTA-AVICULTURE',
  'Élevage bovins et petits ruminants': 'DTM-LTA-BOVINS',
  'Élevage porcins': 'DTM-LTA-PORCINS',
  // Ancien intitulé : la note circulaire sur les curricula LTA attribue la pisciculture aux deux mêmes lycées
  'Production halieutique': 'DTM-LTA-PISCICULTURE',
  'Horticulture vivrière et ornementale': 'DTM-LTA-HORTICULTURE',
  'Production céréalières et légumineuses': 'DTM-LTA-CEREALES',
  'Production de racines et de tubercules': 'DTM-LTA-RACINES-TUBERCULES',
  'Production de plantes à fibres et textiles': 'DTM-LTA-FIBRES',
  'Arboriculture fruitière forestière et produits non ligneux': 'DTM-LTA-ARBORICULTURE',
  // Le communiqué N°0902 dit « palmier à huile et cocotier » ; la fiche du catalogue couvre aussi le karité
  'Production de plantes oléagineuses': 'DTM-LTA-PALMIER-COCOTIER',
};

/** Fiche du catalogue des nouveaux métiers (origine-numéro) → code de fiche. */
export const FICHES_CATALOGUE: Record<string, string> = {
  'LTP-1': 'DTM-LTP-ELEC-ENERGIE',
  'LTP-2': 'DTM-LTP-ENR',
  'LTP-3': 'DTM-LTP-FROID-CLIM',
  'LTP-4': 'DTM-LTP-MAINT-MULTIMEDIA',
  'LTP-5': 'DTM-LTP-RESEAUX-CYBER',
  'LTP-6': 'DTM-LTP-MECA-AUTO',
  'LTP-7': 'DTM-LTP-GROS-OEUVRE',
  'LTP-8': 'DTM-LTP-TOPOGRAPHIE',
  'LTP-9': 'DTM-LTP-ETUDES-BATIMENT',
  'LTP-10': 'DTM-LTP-ACCUEIL-TOURISTIQUE',
  'LTP-11': 'DTM-LTP-BOIS',
  'LTA-1': 'DTM-LTA-AVICULTURE',
  'LTA-2': 'DTM-LTA-BOVINS',
  'LTA-3': 'DTM-LTA-PORCINS',
  'LTA-4': 'DTM-LTA-HORTICULTURE',
  'LTA-5': 'DTM-LTA-PISCICULTURE',
  'LTA-6': 'DTM-LTA-CEREALES',
  'LTA-7': 'DTM-LTA-RACINES-TUBERCULES',
  'LTA-8': 'DTM-LTA-FIBRES',
  'LTA-9': 'DTM-LTA-ARBORICULTURE',
  'LTA-10': 'DTM-LTA-PALMIER-COCOTIER',
};

/**
 * Écoles des métiers citées par le catalogue comme lieux de formation des DTM. Leur implantation n'est
 * donnée par aucun document : département et commune restent inconnus. Elles sont repérées dans les
 * listes du catalogue par leur sigle entre parenthèses, écrit de plusieurs façons selon les fiches.
 */
export const ECOLES_METIERS: { code: string; sigle: string; nom: string }[] = [
  { code: 'EMEDD', sigle: 'EMEDD', nom: "École des métiers de l'énergie et du développement durable (EMEDD)" },
  { code: 'EMN', sigle: 'EMN', nom: 'École des métiers du numérique (EMN)' },
  { code: 'EMAEI', sigle: 'EMAEI', nom: "École des métiers de l'automobile et des équipements industriels (EMAEI)" },
  { code: 'EMBTP', sigle: 'EMBTP', nom: 'École des métiers du bâtiment et des travaux publics (EMBTP)' },
  { code: 'EM-THR', sigle: 'EM THR', nom: "École des métiers du tourisme, de l'hôtellerie et de la restauration (EM THR)" },
];

/** Clé de comparaison des intitulés : casse, espaces et apostrophes typographiques neutralisés. */
export const cleIntitule = (texte: string) => texte.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
