/**
 * Référentiel des filières après le BEPC.
 *
 * - Secondaire technique : documents officiels remis le 16/09/2026 — communiqué N°0902 du MESRS (offre
 *   d'inscription 2026-2027 et conditions chiffrées), répertoires des lycées techniques, catalogues des
 *   nouveaux métiers. Les lieux de formation et le contenu métier sont rattachés par le seed
 *   (correspondances-eftp.ts) ; ce fichier ne porte que la fiche elle-même.
 * - Séries générales du bac : masquées, le site mettant en avant la formation technique.
 * - Supérieur : guide officiel du MESRS 2026-2027 (guide-mesrs-2026-2027.json, outils/extraire-guide-mesrs.py).
 *
 * Règles :
 * - `code` est l'identifiant stable : le seed fait un upsert dessus ;
 * - une information introuvable reste absente : aucun taux d'insertion ni condition n'est inventé ;
 * - chaque entrée cite ses sources ; une entrée sans source `officielle` est à faire valider par le client ;
 * - `domaines` est un classement de l'équipe (src/filiere/domaines.ts), pas une donnée des sources.
 */
import type { NiveauAcces, TypeFiliere } from '@prisma/client';
import type { Domaine } from '../../src/filiere/domaines';

export interface SourceFiliere {
  libelle: string;
  url: string;
  consulteLe: string;
  officielle: boolean;
}

export interface FiliereReferentiel {
  code: string;
  nom: string;
  type: TypeFiliere;
  niveauAcces?: NiveauAcces;
  description: string;
  diplomesDelivres?: string[];
  metiersVises?: string[];
  debouches?: string;
  conditionsAcces?: string;
  seriesAdmises?: string[];
  ouSeFormer?: string;
  bourses?: boolean;
  sources: SourceFiliere[];
  domaines: Domaine[];
  /** Hors du catalogue et du moteur, mais la fiche reste consultable par son lien. */
  masquee?: boolean;
}

const CONSULTE_LE = '2026-09-13';

const REMIS_LE = '2026-09-16';
const SITE_MESRS = 'https://www.enseignementsuperieur.gouv.bj';

const S = {
  officeBac: {
    libelle: 'Office du Baccalauréat — Différentes séries et filières du baccalauréat',
    url: 'https://www.officedubacbenin.bj/spip.php?article10=',
    consulteLe: CONSULTE_LE,
    officielle: true,
  },
  gouvDeat: {
    libelle: "Gouvernement du Bénin — Soutenance des micro-projets de l'examen du DEAT",
    url: 'https://www.gouv.bj/article/2808/soutenance-micro-projets-examen-deat-ministre-kouaro-yves-chabi-galvanise-candidats-membres-jurys/',
    consulteLe: CONSULTE_LE,
    officielle: true,
  },
  // Documents officiels remis le 16/09/2026 (conservés hors dépôt, dossier news/) : le lien mène au site du ministère
  communiqueN0902: {
    libelle: "MESRS — Communiqué N°0902 : registres d'inscription à titre payant dans les LTP, les LTA et l'EFMS, rentrées 2026 et 2027",
    url: SITE_MESRS,
    consulteLe: REMIS_LE,
    officielle: true,
  },
  repertoireLtp: {
    libelle: 'MESRS / DESTFP — Répertoire des lycées techniques professionnels',
    url: SITE_MESRS,
    consulteLe: REMIS_LE,
    officielle: true,
  },
  repertoireLta: {
    libelle: 'MESRS / DESTFP — Répertoire des lycées techniques agricoles',
    url: SITE_MESRS,
    consulteLe: REMIS_LE,
    officielle: true,
  },
  catalogueLtp: {
    libelle: 'MESTFP / DESTFP — Nouveaux métiers des lycées techniques professionnels (DTM)',
    url: SITE_MESRS,
    consulteLe: REMIS_LE,
    officielle: true,
  },
  catalogueLta: {
    libelle: 'MESTFP / DESTFP — Nouveaux métiers des lycées techniques agricoles (DTM), rentrée 2026',
    url: SITE_MESRS,
    consulteLe: REMIS_LE,
    officielle: true,
  },
  wikiSecondaire: {
    libelle: 'Wikipédia — Enseignement secondaire au Bénin',
    url: 'https://fr.wikipedia.org/wiki/Enseignement_secondaire_au_B%C3%A9nin',
    consulteLe: CONSULTE_LE,
    officielle: false,
  },
  wikiSekou: {
    libelle: 'Wikipédia — Lycée agricole Mèdji de Sékou',
    url: 'https://fr.wikipedia.org/wiki/Lyc%C3%A9e_agricole_M%C3%A8dji_de_S%C3%A9kou',
    consulteLe: CONSULTE_LE,
    officielle: false,
  },
  apresbacSeries: {
    libelle: 'apresbac.bj — Filières universitaires par série (site non officiel)',
    url: 'https://apresbac.bj/blog/filieres-universitaires-benin-par-serie',
    consulteLe: CONSULTE_LE,
    officielle: false,
  },
  bacsTechniques: {
    libelle: 'opportunitepourtous.com — Bacs E, F, DT, DEAT, EA : filières pour les profils techniques (site non officiel)',
    url: 'https://opportunitepourtous.com/2026/07/12/filieres-bacs-techniques-benin/',
    consulteLe: CONSULTE_LE,
    officielle: false,
  },
} satisfies Record<string, SourceFiliere>;

// Conditions officielles de l'inscription à titre payant (communiqué N°0902 du MESRS, rentrées 2026 et 2027).
// La moyenne exigée vaut pour CHACUNE des deux matières, et non pour leur moyenne.
const ITP = 'Inscription à titre payant (communiqué N°0902, rentrées 2026 et 2027)';
const COND_BAC_INDUSTRIEL = `${ITP} : titulaire du BEPC ou d'un diplôme reconnu équivalent, âgé de 14 ans au moins et 22 ans au plus au 31/12/2025, avec une moyenne annuelle d'au moins 12/20 en mathématiques et 12/20 en physique, chimie et technologie (PCT).`;
const COND_BAC_GESTION = `${ITP} : titulaire du BEPC ou d'un diplôme reconnu équivalent, âgé de 14 ans au moins et 22 ans au plus au 31/12/2025. Le communiqué ne fixe pas de moyenne minimale pour les séries de gestion.`;
const COND_DTM_INDUSTRIEL = `${ITP} : titulaire du BEPC ou du CAP, âgé de 14 ans au moins et 25 ans au plus au 31/12/2025, avec une moyenne annuelle d'au moins 10/20 en mathématiques et 10/20 en physique, chimie et technologie (PCT).`;
const COND_DTM_AGRICOLE = `${ITP} : titulaire du BEPC ou du CAP, âgé de 14 ans au moins et 25 ans au plus au 31/12/2025, avec une moyenne annuelle d'au moins 10/20 en mathématiques et 10/20 en sciences de la vie et de la Terre (SVT).`;
const COND_DTM_TOURISME = `${ITP} : titulaire du BEPC ou du CAP, âgé de 14 ans au moins et 25 ans au plus au 31/12/2025, avec une moyenne annuelle d'au moins 10/20 en anglais et 10/20 en allemand ou en espagnol.`;

// ─── Enseignement secondaire général ─────────────────────────────────────────

const POURSUITES_A = "Poursuites d'études : droit, lettres, philosophie, communication, langues, histoire-géographie.";

// Le site met en avant la formation technique : le bac général n'est pas proposé comme piste, mais
// sa fiche reste consultable et sa série sert à filtrer le supérieur (« Et après ce bac ? »).
const serieGenerale = (code: string, intitule: string, domaines: Domaine[], debouches?: string): FiliereReferentiel => ({
  code: `BAC-${code}`,
  masquee: true,
  domaines,
  nom: `Baccalauréat série ${code} — ${intitule}`,
  type: 'GENERALE',
  niveauAcces: 'APRES_BEPC',
  description: `Second cycle de l'enseignement secondaire général (Seconde, Première, Terminale), série ${code} : ${intitule}.`,
  diplomesDelivres: [`Baccalauréat série ${code}`],
  debouches,
  ouSeFormer: "Lycées et collèges d'enseignement général (second cycle).",
  sources: debouches ? [S.officeBac, S.wikiSecondaire, S.apresbacSeries] : [S.officeBac, S.wikiSecondaire],
});

// ─── Enseignement secondaire technique ───────────────────────────────────────

const POURSUITES_TECHNIQUES =
  "Poursuites d'études ouvertes aux bacheliers techniques : maintenance industrielle et maintenance automobile (INSTI), concours de l'ENSET, classes préparatoires aux études d'ingénieur (IMSP).";

// Les lieux de formation ne sont pas écrits ici : le seed les rattache depuis les répertoires officiels
// (voir correspondances-eftp.ts). `ouSeFormer` ne porte qu'une précision, quand aucun lieu n'est connu.
const serieTechnique = (
  code: string,
  intitule: string,
  domaines: Domaine[],
  conditionsAcces?: string,
  debouches?: { texte: string; source: SourceFiliere },
): FiliereReferentiel => ({
  code: `BAC-${code}`,
  domaines,
  nom: `Baccalauréat série ${code} — ${intitule}`,
  type: 'TECHNIQUE',
  niveauAcces: 'APRES_BEPC',
  description: `Second cycle de l'enseignement secondaire technique (baccalauréat technologique), série ${code} : ${intitule}. Formation en trois ans dans les lycées techniques professionnels.`,
  diplomesDelivres: [`Baccalauréat série ${code}`],
  debouches: debouches?.texte,
  conditionsAcces,
  sources: [S.officeBac, S.communiqueN0902, S.repertoireLtp, ...(debouches ? [debouches.source] : [])],
});

const diplomeTechnicien = (code: string, specialite: string, secteur: string, domaines: Domaine[]): FiliereReferentiel => ({
  code: `DT-${code}`,
  domaines,
  nom: `Diplôme de technicien (DT) — ${specialite}`,
  type: 'TECHNIQUE',
  niveauAcces: 'APRES_BEPC',
  description: `Formation de technicien, secteur ${secteur}, en trois ans dans les lycées techniques professionnels. Plusieurs formations du supérieur admettent les titulaires du DT au même titre que les bacheliers (guide du MESRS).`,
  diplomesDelivres: ['Diplôme de technicien (DT)'],
  sources: [S.communiqueN0902, S.repertoireLtp],
});

// ─── Formation professionnelle (DTM en lycée technique professionnel) ────────

const dtmLtp = (
  code: string,
  specialite: string,
  description: string,
  metiers: string[],
  domaines: Domaine[],
  conditionsAcces = COND_DTM_INDUSTRIEL,
): FiliereReferentiel => ({
  code: `DTM-LTP-${code}`,
  domaines,
  nom: `DTM — ${specialite}`,
  type: 'PROFESSIONNELLE',
  niveauAcces: 'APRES_BEPC',
  description,
  diplomesDelivres: ['Diplôme de technicien aux métiers (DTM)'],
  metiersVises: metiers,
  debouches: 'Emploi salarié ou création de sa propre entreprise.',
  conditionsAcces,
  sources: [S.catalogueLtp, S.communiqueN0902, S.repertoireLtp],
});

// ─── Enseignement technique agricole ─────────────────────────────────────────

const dtmAgricole = (code: string, specialite: string): FiliereReferentiel => ({
  code: `DTM-LTA-${code}`,
  domaines: ['AGRICULTURE'],
  nom: `DTM — ${specialite}`,
  type: 'TECHNIQUE_AGRICOLE',
  niveauAcces: 'APRES_BEPC',
  description:
    'Formation professionnelle agricole en trois ans dans les lycées techniques agricoles, selon les nouveaux curricula en vigueur depuis la rentrée 2026.',
  diplomesDelivres: ['Diplôme de technicien aux métiers (DTM)'],
  conditionsAcces: COND_DTM_AGRICOLE,
  sources: [S.catalogueLta, S.communiqueN0902, S.repertoireLta],
});

// Les écoles des métiers de référence ne sont plus des fiches de formation : le catalogue officiel
// des nouveaux métiers les cite comme LIEUX où se préparent les DTM (EMEDD, EMN, EMAEI, EMBTP,
// EM THR). Elles deviennent des établissements, rattachés aux fiches DTM concernées.

export const REFERENTIEL_FILIERES: FiliereReferentiel[] = [
  serieGenerale('A1', 'Lettres – Langues', ['LETTRES'], POURSUITES_A),
  serieGenerale('A2', 'Lettres – Sciences humaines', ['LETTRES'], POURSUITES_A),
  serieGenerale('B', 'Lettres – Sciences sociales', ['GESTION', 'DROIT'], "Poursuites d'études : sciences économiques, gestion, droit des affaires, commerce."),
  serieGenerale(
    'C',
    'Sciences et Techniques',
    ['SCIENCES'],
    "Série la plus polyvalente. Poursuites d'études : sciences de la santé, ingénierie, sciences exactes, informatique, économie, droit, agronomie.",
  ),
  serieGenerale('D', 'Biologie – Géologie', ['SCIENCES'], "Poursuites d'études : médecine, agronomie, biologie, géographie, génie de l'environnement."),

  {
    ...serieTechnique('E', 'Mathématiques et Techniques', ['SCIENCES', 'INDUSTRIE'], undefined, {
      texte: POURSUITES_TECHNIQUES,
      source: S.bacsTechniques,
    }),
    ouSeFormer:
      "Aucun lycée technique public ne l'ouvre d'après le répertoire officiel des LTP, et la série E ne figure pas dans l'offre d'inscription 2026-2027 du communiqué N°0902.",
    sources: [S.officeBac, S.bacsTechniques],
  },
  serieTechnique('F1', 'Construction mécanique', ['INDUSTRIE'], COND_BAC_INDUSTRIEL, { texte: POURSUITES_TECHNIQUES, source: S.bacsTechniques }),
  {
    ...serieTechnique('F2', 'Électronique', ['ELECTRICITE'], COND_BAC_INDUSTRIEL, { texte: POURSUITES_TECHNIQUES, source: S.bacsTechniques }),
    ouSeFormer:
      "Série ouverte dans l'offre d'inscription 2026-2027 (communiqué N°0902), mais aucun lycée ne la propose dans le répertoire officiel des LTP : se renseigner auprès de la direction départementale de l'enseignement technique.",
  },
  serieTechnique('F3', 'Électrotechnique', ['ELECTRICITE'], COND_BAC_INDUSTRIEL, { texte: POURSUITES_TECHNIQUES, source: S.bacsTechniques }),
  serieTechnique('F4', 'Génie civil', ['BTP'], COND_BAC_INDUSTRIEL, { texte: POURSUITES_TECHNIQUES, source: S.bacsTechniques }),
  serieTechnique('G1', 'Techniques administratives', ['GESTION'], COND_BAC_GESTION),
  serieTechnique('G2', 'Techniques quantitatives de gestion', ['GESTION'], COND_BAC_GESTION, {
    texte: "Poursuites d'études : comptabilité, gestion des organisations, informatique de gestion, techniques commerciales.",
    source: S.apresbacSeries,
  }),
  serieTechnique('G3', 'Techniques commerciales', ['GESTION'], COND_BAC_GESTION),
  {
    // Absente de l'offre du communiqué N°0902 : ses conditions d'inscription ne sont pas publiées
    ...serieTechnique('EA', 'Eau et Assainissement', ['ENVIRONNEMENT'], undefined, {
      texte: "Poursuites d'études : spécialités universitaires de l'eau et de l'assainissement.",
      source: S.bacsTechniques,
    }),
    nom: 'Baccalauréat — filière Eau et Assainissement',
    description:
      "Filière de l'enseignement secondaire technique consacrée à l'eau et à l'assainissement, en trois ans dans les lycées techniques professionnels.",
    diplomesDelivres: ['Baccalauréat — filière Eau et Assainissement'],
    sources: [S.officeBac, S.repertoireLtp, S.bacsTechniques],
  },

  diplomeTechnicien('MECANO-SOUDURE', "Constructeur d'équipements mécano-soudés", 'industriel', ['INDUSTRIE']),
  diplomeTechnicien('MODE', 'Métiers de la mode et du vêtement', 'mode', ['ARTISANAT']),
  diplomeTechnicien('DEV-WEB-MOBILE', "Développeur d'applications web et mobile", 'numérique', ['NUMERIQUE']),
  diplomeTechnicien('MULTIMEDIA', 'Producteur multimédia', 'numérique', ['NUMERIQUE']),
  {
    ...diplomeTechnicien('FABRICATION-MECANIQUE', 'Fabrication mécanique', 'industriel', ['INDUSTRIE']),
    description:
      "Formation de technicien en fabrication mécanique (FM), filière sciences et techniques industrielles. Cette spécialité figure au répertoire officiel des lycées techniques professionnels mais pas dans l'offre d'inscription 2026-2027 du communiqué N°0902 : se renseigner auprès du lycée avant de la choisir.",
    sources: [S.repertoireLtp],
  },

  dtmLtp('ELEC-ENERGIE', "Métiers de l'électricité", 'Installation, maintenance et dépannage des systèmes électriques en milieu résidentiel, tertiaire et industriel.', ['Électricien'], ['ELECTRICITE']),
  dtmLtp('ENR', 'Énergies renouvelables', "Installation et maintenance d'équipements solaires photovoltaïques et thermiques.", ['Installateur solaire'], ['ELECTRICITE']),
  dtmLtp('FROID-CLIM', "Froid sanitaire et conditionnement d'air", 'Installation et maintenance des équipements frigorifiques, de climatisation et sanitaires.', ['Technicien frigoriste'], ['ELECTRICITE', 'BTP']),
  dtmLtp('MAINT-MULTIMEDIA', "Maintenance d'équipements électroniques, option multimédia", "Réparation d'appareils audio, vidéo et informatiques.", ['Technicien de maintenance électronique'], ['ELECTRICITE', 'NUMERIQUE']),
  dtmLtp('RESEAUX-CYBER', 'Réseau et sécurité informatique', 'Déploiement de réseaux informatiques et protection des données.', ['Technicien réseaux'], ['NUMERIQUE']),
  dtmLtp('MECA-AUTO', 'Maintenance de voitures particulières', 'Entretien et diagnostic des véhicules.', ['Mécanicien automobile'], ['INDUSTRIE']),
  dtmLtp('GROS-OEUVRE', 'Réalisation de gros œuvres', 'Fondations, maçonnerie et béton armé.', ['Technicien du bâtiment'], ['BTP']),
  dtmLtp('TOPOGRAPHIE', 'Géomètre-topographe', 'Levés topographiques et cartographie.', ['Topographe'], ['BTP']),
  dtmLtp('ETUDES-BATIMENT', "Technicien d'études du bâtiment", 'Dessin assisté par ordinateur, planification et estimation des coûts.', ["Technicien d'études du bâtiment"], ['BTP']),
  dtmLtp('BOIS', 'Fabrication et équipement en bois', "Fabrication de meubles, de menuiseries et d'équipements en bois.", [], ['ARTISANAT', 'BTP']),
  dtmLtp('ACCUEIL-TOURISTIQUE', 'Accueil touristique', "Accueil, information et orientation des touristes et des visiteurs.", [], ['TOURISME'], COND_DTM_TOURISME),
  {
    // 12e métier du communiqué N°0902 : annoncé comme DTM et non comme DT, contrairement à la presse
    ...dtmLtp('QUALITE-EAU', "Contrôleur de la qualité de l'eau", "Contrôle de la qualité de l'eau de consommation et des rejets, prélèvements et analyses.", ["Contrôleur de la qualité de l'eau"], ['ENVIRONNEMENT']),
    ouSeFormer:
      "Métier annoncé dans l'offre d'inscription 2026-2027 (communiqué N°0902), sans lycée dans le répertoire officiel ni fiche dans le catalogue des nouveaux métiers : se renseigner auprès de la direction départementale de l'enseignement technique.",
    sources: [S.communiqueN0902],
  },

  {
    code: 'EFMS-HYGIENISTE-ASSAINISSEMENT',
    nom: "Hygiéniste d'assainissement — École de formation médico-sociale",
    type: 'PROFESSIONNELLE',
    niveauAcces: 'APRES_BEPC',
    description: "Formation médico-sociale en trois ans, sanctionnée par un diplôme d'État.",
    diplomesDelivres: ["Diplôme d'État"],
    metiersVises: ["Hygiéniste d'assainissement"],
    domaines: ['SANTE', 'ENVIRONNEMENT'],
    conditionsAcces: `${ITP} : titulaire du BEPC ou d'un diplôme reconnu équivalent, âgé de 15 ans au moins et 25 ans au plus au 31/12/2025.`,
    ouSeFormer: "Le communiqué N°0902 mentionne aussi une annexe de l'EFMS de Parakou à Djougou.",
    sources: [S.communiqueN0902, S.repertoireLtp],
  },
  {
    code: 'EFMS-HYGIENISTE-SALLES',
    nom: 'Hygiéniste de salles — École de formation médico-sociale',
    type: 'PROFESSIONNELLE',
    niveauAcces: 'APRES_BEPC',
    description: "Formation médico-sociale en un an, sanctionnée par un diplôme d'État.",
    diplomesDelivres: ["Diplôme d'État"],
    metiersVises: ['Hygiéniste de salles'],
    domaines: ['SANTE'],
    conditionsAcces: `${ITP} : titulaire du BEPC ou d'un diplôme reconnu équivalent, âgé de 17 ans au moins et 25 ans au plus au 31/12/2025.`,
    ouSeFormer: "Le communiqué N°0902 mentionne aussi une annexe de l'EFMS de Parakou à Djougou.",
    sources: [S.communiqueN0902, S.repertoireLtp],
  },

  dtmAgricole('AVICULTURE', 'Aviculture, cuniculture et élevages non conventionnels'),
  dtmAgricole('BOVINS', 'Élevage de bovins et petits ruminants'),
  dtmAgricole('PORCINS', 'Élevage de porcins'),
  dtmAgricole('PISCICULTURE', 'Pisciculture et aquaculture'),
  dtmAgricole('HORTICULTURE', 'Horticulture vivrière et ornementale'),
  dtmAgricole('CEREALES', 'Production céréalière et légumineuse'),
  dtmAgricole('RACINES-TUBERCULES', 'Production de racines et tubercules'),
  dtmAgricole('FIBRES', 'Production de plantes à fibres et textiles'),
  dtmAgricole('ARBORICULTURE', 'Arboriculture fruitière, forestière et produits non ligneux'),
  // Intitulé du catalogue ; le communiqué N°0902 dit « Production de palmier à huile et cocotier »
  dtmAgricole('PALMIER-COCOTIER', 'Production de plantes oléagineuses'),
  {
    // 11e métier agricole du communiqué N°0902, absent du répertoire et du catalogue
    ...dtmAgricole('MACHINISME', 'Maintenance des matériels et machines agricoles'),
    domaines: ['AGRICULTURE', 'INDUSTRIE'],
    ouSeFormer:
      "Métier annoncé dans l'offre d'inscription 2026-2027 (communiqué N°0902), sans lycée dans le répertoire officiel ni fiche dans le catalogue des nouveaux métiers : se renseigner auprès de la direction départementale de l'enseignement technique.",
    sources: [S.communiqueN0902],
  },
  {
    code: 'DEAT',
    nom: "Diplôme d'études agricoles tropicales (DEAT)",
    type: 'TECHNIQUE_AGRICOLE',
    niveauAcces: 'APRES_BEPC',
    description:
      'Formation agricole en trois ans. Six spécialités : forêts, production animale, production végétale, pêche et aquaculture, aménagement et équipement rural, nutrition et technologie alimentaire.',
    diplomesDelivres: ["Diplôme d'études agricoles tropicales (DEAT)"],
    conditionsAcces: "Titulaire du BEPC, du BEAT (brevet d'études agricoles tropicales) ou d'un diplôme équivalent reconnu.",
    ouSeFormer: 'Lycée agricole Mèdji de Sékou (Allada), notamment.',
    sources: [S.gouvDeat, S.wikiSekou],
    domaines: ['AGRICULTURE'],
  },

];
