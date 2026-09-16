/**
 * Référentiel des filières après le BEPC — constitué le 13/09/2026 à partir de sources publiques,
 * en attendant le référentiel officiel du MESTFP (secondaire, technique).
 * Les filières du supérieur viennent du guide officiel du MESRS 2026-2027 : guide-mesrs-2026-2027.json,
 * produit par outils/extraire-guide-mesrs.py.
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
}

const CONSULTE_LE = '2026-09-13';

const S = {
  officeBac: {
    libelle: 'Office du Baccalauréat — Différentes séries et filières du baccalauréat',
    url: 'https://www.officedubacbenin.bj/spip.php?article10=',
    consulteLe: CONSULTE_LE,
    officielle: true,
  },
  gouvAgricole: {
    libelle: 'Gouvernement du Bénin — Formations agricoles : nouvelles filières 2026-2027',
    url: 'https://www.gouv.bj/article/3635/formations-agricoles-benin-decouvrez-nouvelles-filieres-avenir-annee-2026-2027/',
    consulteLe: CONSULTE_LE,
    officielle: true,
  },
  gouvDeat: {
    libelle: "Gouvernement du Bénin — Soutenance des micro-projets de l'examen du DEAT",
    url: 'https://www.gouv.bj/article/2808/soutenance-micro-projets-examen-deat-ministre-kouaro-yves-chabi-galvanise-candidats-membres-jurys/',
    consulteLe: CONSULTE_LE,
    officielle: true,
  },
  pagEcolesMetiers: {
    libelle: "Bénin Révélé (PAG) — 30 lycées techniques agricoles et 7 écoles de métiers de référence",
    url: 'https://beninrevele.bj/projet/159/mise-place-lycees-techniques-agricoles-modernes-ecoles-metiers-reference/',
    consulteLe: CONSULTE_LE,
    officielle: true,
  },
  communiqueInscriptions: {
    libelle: 'Bénin Web TV — Communiqué MESTFP du 16/07/2026 : inscriptions à titre payant LTP, LTA et EFMS 2026-2027',
    url: 'https://beninwebtv.bj/benin-ouverture-des-inscriptions-a-titre-payant-dans-les-lycees-techniques-et-lecole-de-formation-medico-sociale-pour-2026-2027/',
    consulteLe: CONSULTE_LE,
    officielle: false,
  },
  dtmLtp: {
    libelle: 'Les 4 Vérités — Neuf nouvelles filières professionnelles (18/08/2026)',
    url: 'https://www.les4verites.bj/neuf-nouvelles-filieres-professionnelles-pour-coller-aux-besoins-des-entreprises/',
    consulteLe: CONSULTE_LE,
    officielle: false,
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

const COND_BAC_TECHNIQUE =
  "Titulaire du BEPC, âgé de 14 à 22 ans au 31/12/2025, avec au moins 12/20 dans les matières de spécialité (conditions publiées pour l'inscription à titre payant en lycée technique, rentrée 2026-2027).";
const COND_DTM =
  "Titulaire du BEPC ou du CAP, âgé de 14 à 25 ans au 31/12/2025, avec au moins 10/20 dans les matières clés (conditions publiées pour l'inscription à titre payant, rentrée 2026-2027).";

// ─── Enseignement secondaire général ─────────────────────────────────────────

const POURSUITES_A = "Poursuites d'études : droit, lettres, philosophie, communication, langues, histoire-géographie.";

const serieGenerale = (code: string, intitule: string, domaines: Domaine[], debouches?: string): FiliereReferentiel => ({
  code: `BAC-${code}`,
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

const serieTechnique = (
  code: string,
  intitule: string,
  domaines: Domaine[],
  debouches?: { texte: string; source: SourceFiliere },
): FiliereReferentiel => ({
  code: `BAC-${code}`,
  domaines,
  nom: `Baccalauréat série ${code} — ${intitule}`,
  type: 'TECHNIQUE',
  niveauAcces: 'APRES_BEPC',
  description: `Second cycle de l'enseignement secondaire technique, série ${code} : ${intitule}.`,
  diplomesDelivres: [`Baccalauréat série ${code}`],
  debouches: debouches?.texte,
  conditionsAcces: COND_BAC_TECHNIQUE,
  ouSeFormer: 'Lycées techniques (liste des établissements à obtenir auprès du MESTFP).',
  sources: [S.officeBac, S.communiqueInscriptions, ...(debouches ? [debouches.source] : [])],
});

const diplomeTechnicien = (code: string, specialite: string, secteur: string, domaines: Domaine[]): FiliereReferentiel => ({
  code: `DT-${code}`,
  domaines,
  nom: `Diplôme de technicien (DT) — ${specialite}`,
  type: 'TECHNIQUE',
  niveauAcces: 'APRES_BEPC',
  description: `Formation de technicien, secteur ${secteur}. Le DT est considéré comme l'équivalent du baccalauréat pour les filières techniques. Intitulé repris d'un relais presse du communiqué ministériel : à confirmer.`,
  diplomesDelivres: ['Diplôme de technicien (DT)'],
  ouSeFormer: 'Lycées techniques professionnels (établissements à préciser).',
  sources: [S.communiqueInscriptions, S.wikiSecondaire],
});

// ─── Formation professionnelle (DTM en lycée technique professionnel) ────────

const dtmLtp = (code: string, specialite: string, description: string, metiers: string[], domaines: Domaine[]): FiliereReferentiel => ({
  code: `DTM-LTP-${code}`,
  domaines,
  nom: `DTM — ${specialite}`,
  type: 'PROFESSIONNELLE',
  niveauAcces: 'APRES_BEPC',
  description: `${description} Filière ouverte à la rentrée 2026-2027 dans les lycées techniques professionnels (intitulé exact à confirmer).`,
  diplomesDelivres: ['Diplôme de technicien aux métiers (DTM)'],
  metiersVises: metiers,
  debouches: 'Emploi salarié ou création de sa propre entreprise.',
  conditionsAcces: COND_DTM,
  ouSeFormer: 'Lycées techniques professionnels (LTP) du pays.',
  sources: [S.dtmLtp, S.communiqueInscriptions],
});

// ─── Enseignement technique agricole ─────────────────────────────────────────

const dtmAgricole = (code: string, specialite: string): FiliereReferentiel => ({
  code: `DTM-LTA-${code}`,
  domaines: ['AGRICULTURE'],
  nom: `DTM — ${specialite}`,
  type: 'TECHNIQUE_AGRICOLE',
  niveauAcces: 'APRES_BEPC',
  description: 'Formation professionnelle agricole ouverte à la rentrée 2026-2027 dans les lycées techniques agricoles.',
  diplomesDelivres: ['Diplôme de technicien aux métiers (DTM)'],
  conditionsAcces: COND_DTM,
  ouSeFormer:
    'Lycées techniques agricoles (LTA) — 30 établissements prévus par le programme gouvernemental ; liste à obtenir auprès du MESTFP.',
  sources: [S.gouvAgricole, S.communiqueInscriptions],
});

// ─── Écoles des métiers de référence ─────────────────────────────────────────

const ecoleMetiers = (code: string, domaine: string, domaines: Domaine[]): FiliereReferentiel => ({
  code: `EDM-${code}`,
  domaines,
  nom: `École des métiers de référence — ${domaine}`,
  type: 'ECOLE_METIER',
  description:
    "Domaine couvert par l'une des écoles des métiers de référence du Programme d'action du gouvernement. Nombre d'écoles, implantation, diplômes et conditions d'accès à préciser par le MESTFP.",
  sources: [S.pagEcolesMetiers],
});

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

  serieTechnique('E', 'Mathématiques et Techniques', ['SCIENCES', 'INDUSTRIE'], { texte: POURSUITES_TECHNIQUES, source: S.bacsTechniques }),
  serieTechnique('F1', 'Construction mécanique', ['INDUSTRIE'], { texte: POURSUITES_TECHNIQUES, source: S.bacsTechniques }),
  serieTechnique('F2', 'Électronique', ['ELECTRICITE'], { texte: POURSUITES_TECHNIQUES, source: S.bacsTechniques }),
  serieTechnique('F3', 'Électrotechnique', ['ELECTRICITE'], { texte: POURSUITES_TECHNIQUES, source: S.bacsTechniques }),
  serieTechnique('F4', 'Génie civil', ['BTP'], { texte: POURSUITES_TECHNIQUES, source: S.bacsTechniques }),
  serieTechnique('G1', 'Techniques administratives', ['GESTION']),
  serieTechnique('G2', 'Techniques quantitatives de gestion', ['GESTION'], {
    texte: "Poursuites d'études : comptabilité, gestion des organisations, informatique de gestion, techniques commerciales.",
    source: S.apresbacSeries,
  }),
  serieTechnique('G3', 'Techniques commerciales', ['GESTION']),
  {
    ...serieTechnique('EA', 'Eau et Assainissement', ['ENVIRONNEMENT'], {
      texte: "Poursuites d'études : spécialités universitaires de l'eau et de l'assainissement.",
      source: S.bacsTechniques,
    }),
    nom: 'Baccalauréat — filière Eau et Assainissement',
    description: "Filière de l'enseignement secondaire technique consacrée à l'eau et à l'assainissement.",
    diplomesDelivres: ['Baccalauréat — filière Eau et Assainissement'],
  },

  diplomeTechnicien('MECANO-SOUDURE', "Constructeur d'équipements mécano-soudés", 'industriel', ['INDUSTRIE']),
  diplomeTechnicien('MODE', 'Métiers de la mode', 'mode', ['ARTISANAT']),
  diplomeTechnicien('DEV-WEB-MOBILE', 'Développeur web et mobile', 'numérique', ['NUMERIQUE']),
  diplomeTechnicien('MULTIMEDIA', 'Producteur multimédia', 'numérique', ['NUMERIQUE']),
  diplomeTechnicien('QUALITE-EAU', "Contrôleur de qualité de l'eau", 'environnement', ['ENVIRONNEMENT']),

  dtmLtp('ELEC-ENERGIE', 'Électricité et systèmes énergétiques', 'Installation, maintenance et dépannage des systèmes électriques en milieu résidentiel, tertiaire et industriel.', ['Électricien'], ['ELECTRICITE']),
  dtmLtp('ENR', 'Énergies renouvelables', "Installation et maintenance d'équipements solaires photovoltaïques et thermiques.", ['Installateur solaire'], ['ELECTRICITE']),
  dtmLtp('FROID-CLIM', 'Froid, climatisation et installations sanitaires', 'Installation et maintenance des équipements frigorifiques, de climatisation et sanitaires.', ['Technicien frigoriste'], ['ELECTRICITE', 'BTP']),
  dtmLtp('MAINT-MULTIMEDIA', 'Maintenance électronique et multimédia', "Réparation d'appareils audio, vidéo et informatiques.", ['Technicien de maintenance électronique'], ['ELECTRICITE', 'NUMERIQUE']),
  dtmLtp('RESEAUX-CYBER', 'Réseaux informatiques et cybersécurité', 'Déploiement de réseaux informatiques et protection des données.', ['Technicien réseaux'], ['NUMERIQUE']),
  dtmLtp('MECA-AUTO', 'Mécanique automobile', 'Entretien et diagnostic des véhicules.', ['Mécanicien automobile'], ['INDUSTRIE']),
  dtmLtp('GROS-OEUVRE', 'Construction bâtiment — gros œuvre', 'Fondations, maçonnerie et béton armé.', ['Technicien du bâtiment'], ['BTP']),
  dtmLtp('TOPOGRAPHIE', 'Topographie', 'Levés topographiques et cartographie.', ['Topographe'], ['BTP']),
  dtmLtp('ETUDES-BATIMENT', "Technicien d'études du bâtiment", 'Dessin assisté par ordinateur, planification et estimation des coûts.', ["Technicien d'études du bâtiment"], ['BTP']),

  {
    code: 'EFMS-HYGIENISTE-ASSAINISSEMENT',
    nom: "Hygiéniste d'assainissement — École de formation médico-sociale",
    type: 'PROFESSIONNELLE',
    niveauAcces: 'APRES_BEPC',
    description: "Formation médico-sociale sanctionnée par un diplôme d'État (intitulé exact à confirmer).",
    diplomesDelivres: ["Diplôme d'État"],
    metiersVises: ["Hygiéniste d'assainissement"],
    domaines: ['SANTE', 'ENVIRONNEMENT'],
    conditionsAcces: 'Titulaire du BEPC, âgé de 15 à 25 ans au 31/12/2025 (inscription à titre payant, rentrée 2026-2027).',
    ouSeFormer: 'École de formation médico-sociale (EFMS) de Parakou et son annexe de Djougou.',
    sources: [S.communiqueInscriptions],
  },
  {
    code: 'EFMS-HYGIENISTE-SALLES',
    nom: 'Hygiéniste de salles — École de formation médico-sociale',
    type: 'PROFESSIONNELLE',
    niveauAcces: 'APRES_BEPC',
    description: "Formation médico-sociale sanctionnée par un diplôme d'État (intitulé exact à confirmer).",
    diplomesDelivres: ["Diplôme d'État"],
    metiersVises: ['Hygiéniste de salles'],
    domaines: ['SANTE'],
    conditionsAcces: 'Titulaire du BEPC, âgé de 17 à 25 ans au 31/12/2025 (inscription à titre payant, rentrée 2026-2027).',
    ouSeFormer: 'École de formation médico-sociale (EFMS) de Parakou et son annexe de Djougou.',
    sources: [S.communiqueInscriptions],
  },

  dtmAgricole('AVICULTURE', 'Aviculture, cuniculture et élevages non conventionnels'),
  dtmAgricole('BOVINS', 'Élevage de bovins et de petits ruminants'),
  dtmAgricole('PORCINS', 'Élevage de porcins'),
  dtmAgricole('PISCICULTURE', 'Pisciculture et aquaculture'),
  dtmAgricole('HORTICULTURE', 'Horticulture vivrière et ornementale'),
  dtmAgricole('CEREALES', 'Production céréalière et légumineuse'),
  dtmAgricole('RACINES-TUBERCULES', 'Production de racines et tubercules'),
  dtmAgricole('FIBRES', 'Production de plantes à fibres et textiles'),
  dtmAgricole('ARBORICULTURE', 'Arboriculture fruitière, forestière et produits forestiers non ligneux'),
  dtmAgricole('PALMIER-COCOTIER', 'Palmier à huile et cocotier'),
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

  ecoleMetiers('NUMERIQUE', 'Numérique', ['NUMERIQUE']),
  ecoleMetiers('BTP', 'Bâtiment et travaux publics', ['BTP']),
  ecoleMetiers('ELECTRONIQUE', 'Électronique et électrotechnique', ['ELECTRICITE']),
  ecoleMetiers('AUTOMOBILE', 'Automobile et équipements industriels', ['INDUSTRIE']),
  ecoleMetiers('BOIS-ALUMINIUM', 'Bois et aluminium', ['ARTISANAT', 'BTP']),
  ecoleMetiers('TOURISME-HOTELLERIE', 'Tourisme, hôtellerie et restauration', ['TOURISME']),
];
