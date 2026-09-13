/**
 * Référentiel des filières — constitué le 13/09/2026 à partir de sources publiques,
 * en attendant le référentiel officiel du MESTFP (secondaire, technique) et du MESRS (supérieur).
 *
 * Règles :
 * - `code` est l'identifiant stable : le seed fait un upsert dessus ;
 * - une information introuvable reste absente : aucun taux d'insertion ni condition n'est inventé ;
 * - chaque entrée cite ses sources ; une entrée sans source `officielle` est à faire valider par le client.
 */
import type { NiveauAcces, TypeFiliere } from '@prisma/client';

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
  apresbacUac: {
    libelle: "apresbac.bj — Université d'Abomey-Calavi : filières et admission (site non officiel)",
    url: 'https://apresbac.bj/universites/uac',
    consulteLe: CONSULTE_LE,
    officielle: false,
  },
  apresbacGuide: {
    libelle: 'apresbac.bj — Guide orientation bac Bénin 2026 (site non officiel)',
    url: 'https://apresbac.bj/blog/guide-orientation-bac-benin-2026',
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
const COND_UNIVERSITE =
  "Être titulaire du baccalauréat dans une série admise. Choix des filières et classement sur la plateforme officielle apresmonbac.bj (places boursières, secours ou payantes).";

// ─── Enseignement secondaire général ─────────────────────────────────────────

const POURSUITES_A = "Poursuites d'études : droit, lettres, philosophie, communication, langues, histoire-géographie.";

const serieGenerale = (code: string, intitule: string, debouches?: string): FiliereReferentiel => ({
  code: `BAC-${code}`,
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
  debouches?: { texte: string; source: SourceFiliere },
): FiliereReferentiel => ({
  code: `BAC-${code}`,
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

const diplomeTechnicien = (code: string, specialite: string, secteur: string): FiliereReferentiel => ({
  code: `DT-${code}`,
  nom: `Diplôme de technicien (DT) — ${specialite}`,
  type: 'TECHNIQUE',
  niveauAcces: 'APRES_BEPC',
  description: `Formation de technicien, secteur ${secteur}. Le DT est considéré comme l'équivalent du baccalauréat pour les filières techniques. Intitulé repris d'un relais presse du communiqué ministériel : à confirmer.`,
  diplomesDelivres: ['Diplôme de technicien (DT)'],
  ouSeFormer: 'Lycées techniques professionnels (établissements à préciser).',
  sources: [S.communiqueInscriptions, S.wikiSecondaire],
});

// ─── Formation professionnelle (DTM en lycée technique professionnel) ────────

const dtmLtp = (code: string, specialite: string, description: string, metiers: string[]): FiliereReferentiel => ({
  code: `DTM-LTP-${code}`,
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

const ecoleMetiers = (code: string, domaine: string): FiliereReferentiel => ({
  code: `EDM-${code}`,
  nom: `École des métiers de référence — ${domaine}`,
  type: 'ECOLE_METIER',
  description:
    "Domaine couvert par l'une des écoles des métiers de référence du Programme d'action du gouvernement. Nombre d'écoles, implantation, diplômes et conditions d'accès à préciser par le MESTFP.",
  sources: [S.pagEcolesMetiers],
});

// ─── Enseignement supérieur public ───────────────────────────────────────────

const universitaire = (f: {
  code: string;
  nom: string;
  etablissement: string;
  lieu: string;
  description: string;
  series?: string[];
  diplomes?: string[];
  metiers?: string[];
  conditions?: string;
  sources?: SourceFiliere[];
}): FiliereReferentiel => ({
  code: `UNIV-${f.code}`,
  nom: `${f.nom} — ${f.etablissement}`,
  type: 'UNIVERSITE',
  niveauAcces: 'APRES_BAC',
  description: f.description,
  diplomesDelivres: f.diplomes,
  metiersVises: f.metiers,
  conditionsAcces: f.conditions ?? COND_UNIVERSITE,
  seriesAdmises: f.series,
  ouSeFormer: f.lieu,
  bourses: true,
  sources: [...(f.sources ?? [S.apresbacUac]), S.apresbacGuide],
});

const FSS = "Faculté des sciences de la santé (FSS) — Université d'Abomey-Calavi";
const EPAC = "École polytechnique d'Abomey-Calavi (EPAC) — Université d'Abomey-Calavi";
const FAST = "Faculté des sciences et techniques (FAST) — Université d'Abomey-Calavi";
const FASEG = "Faculté des sciences économiques et de gestion (FASEG) — Université d'Abomey-Calavi";
const FADESP = "Faculté de droit et de science politique (FADESP) — Université d'Abomey-Calavi";
const FLASH = "Faculté des lettres, arts et sciences humaines (FLASH) — Université d'Abomey-Calavi";
const IFRI = "Institut de formation et de recherche en informatique (IFRI) — Université d'Abomey-Calavi";
const ENEAM = "École nationale d'économie appliquée et de management (ENEAM) — Université d'Abomey-Calavi";
const INSTI = 'Institut national supérieur de technologie industrielle (INSTI) — UNSTIM';
const ENSET = "École normale supérieure de l'enseignement technique (ENSET) — UNSTIM";
const IMSP = "Institut de mathématiques et de sciences physiques (IMSP) — Université d'Abomey-Calavi";

export const REFERENTIEL_FILIERES: FiliereReferentiel[] = [
  serieGenerale('A1', 'Lettres – Langues', POURSUITES_A),
  serieGenerale('A2', 'Lettres – Sciences humaines', POURSUITES_A),
  serieGenerale('B', 'Lettres – Sciences sociales', "Poursuites d'études : sciences économiques, gestion, droit des affaires, commerce."),
  serieGenerale(
    'C',
    'Sciences et Techniques',
    "Série la plus polyvalente. Poursuites d'études : sciences de la santé, ingénierie, sciences exactes, informatique, économie, droit, agronomie.",
  ),
  serieGenerale('D', 'Biologie – Géologie', "Poursuites d'études : médecine, agronomie, biologie, géographie, génie de l'environnement."),

  serieTechnique('E', 'Mathématiques et Techniques', { texte: POURSUITES_TECHNIQUES, source: S.bacsTechniques }),
  serieTechnique('F1', 'Construction mécanique', { texte: POURSUITES_TECHNIQUES, source: S.bacsTechniques }),
  serieTechnique('F2', 'Électronique', { texte: POURSUITES_TECHNIQUES, source: S.bacsTechniques }),
  serieTechnique('F3', 'Électrotechnique', { texte: POURSUITES_TECHNIQUES, source: S.bacsTechniques }),
  serieTechnique('F4', 'Génie civil', { texte: POURSUITES_TECHNIQUES, source: S.bacsTechniques }),
  serieTechnique('G1', 'Techniques administratives'),
  serieTechnique('G2', 'Techniques quantitatives de gestion', {
    texte: "Poursuites d'études : comptabilité, gestion des organisations, informatique de gestion, techniques commerciales.",
    source: S.apresbacSeries,
  }),
  serieTechnique('G3', 'Techniques commerciales'),
  {
    ...serieTechnique('EA', 'Eau et Assainissement', {
      texte: "Poursuites d'études : spécialités universitaires de l'eau et de l'assainissement.",
      source: S.bacsTechniques,
    }),
    nom: 'Baccalauréat — filière Eau et Assainissement',
    description: "Filière de l'enseignement secondaire technique consacrée à l'eau et à l'assainissement.",
    diplomesDelivres: ['Baccalauréat — filière Eau et Assainissement'],
  },

  diplomeTechnicien('MECANO-SOUDURE', "Constructeur d'équipements mécano-soudés", 'industriel'),
  diplomeTechnicien('MODE', 'Métiers de la mode', 'mode'),
  diplomeTechnicien('DEV-WEB-MOBILE', 'Développeur web et mobile', 'numérique'),
  diplomeTechnicien('MULTIMEDIA', 'Producteur multimédia', 'numérique'),
  diplomeTechnicien('QUALITE-EAU', "Contrôleur de qualité de l'eau", 'environnement'),

  dtmLtp('ELEC-ENERGIE', 'Électricité et systèmes énergétiques', 'Installation, maintenance et dépannage des systèmes électriques en milieu résidentiel, tertiaire et industriel.', ['Électricien']),
  dtmLtp('ENR', 'Énergies renouvelables', "Installation et maintenance d'équipements solaires photovoltaïques et thermiques.", ['Installateur solaire']),
  dtmLtp('FROID-CLIM', 'Froid, climatisation et installations sanitaires', 'Installation et maintenance des équipements frigorifiques, de climatisation et sanitaires.', ['Technicien frigoriste']),
  dtmLtp('MAINT-MULTIMEDIA', 'Maintenance électronique et multimédia', "Réparation d'appareils audio, vidéo et informatiques.", ['Technicien de maintenance électronique']),
  dtmLtp('RESEAUX-CYBER', 'Réseaux informatiques et cybersécurité', 'Déploiement de réseaux informatiques et protection des données.', ['Technicien réseaux']),
  dtmLtp('MECA-AUTO', 'Mécanique automobile', 'Entretien et diagnostic des véhicules.', ['Mécanicien automobile']),
  dtmLtp('GROS-OEUVRE', 'Construction bâtiment — gros œuvre', 'Fondations, maçonnerie et béton armé.', ['Technicien du bâtiment']),
  dtmLtp('TOPOGRAPHIE', 'Topographie', 'Levés topographiques et cartographie.', ['Topographe']),
  dtmLtp('ETUDES-BATIMENT', "Technicien d'études du bâtiment", 'Dessin assisté par ordinateur, planification et estimation des coûts.', ["Technicien d'études du bâtiment"]),

  {
    code: 'EFMS-HYGIENISTE-ASSAINISSEMENT',
    nom: "Hygiéniste d'assainissement — École de formation médico-sociale",
    type: 'PROFESSIONNELLE',
    niveauAcces: 'APRES_BEPC',
    description: "Formation médico-sociale sanctionnée par un diplôme d'État (intitulé exact à confirmer).",
    diplomesDelivres: ["Diplôme d'État"],
    metiersVises: ["Hygiéniste d'assainissement"],
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
  },

  ecoleMetiers('NUMERIQUE', 'Numérique'),
  ecoleMetiers('BTP', 'Bâtiment et travaux publics'),
  ecoleMetiers('ELECTRONIQUE', 'Électronique et électrotechnique'),
  ecoleMetiers('AUTOMOBILE', 'Automobile et équipements industriels'),
  ecoleMetiers('BOIS-ALUMINIUM', 'Bois et aluminium'),
  ecoleMetiers('TOURISME-HOTELLERIE', 'Tourisme, hôtellerie et restauration'),

  universitaire({ code: 'FSS-MEDECINE', nom: 'Médecine générale', etablissement: 'FSS (UAC)', lieu: FSS, description: 'Études de médecine en 7 ans.', series: ['C', 'D'], metiers: ['Médecin'] }),
  universitaire({ code: 'FSS-PHARMACIE', nom: 'Pharmacie', etablissement: 'FSS (UAC)', lieu: FSS, description: 'Études de pharmacie en 6 ans.', series: ['C', 'D'], metiers: ["Pharmacien d'officine", 'Pharmacien hospitalier'] }),
  universitaire({ code: 'FSS-DENTAIRE', nom: 'Chirurgie dentaire', etablissement: 'FSS (UAC)', lieu: FSS, description: 'Études de chirurgie dentaire en 6 ans.', series: ['C', 'D'], metiers: ['Chirurgien-dentiste'] }),
  universitaire({ code: 'EPAC-GIT', nom: 'Génie informatique et télécommunications', etablissement: 'EPAC (UAC)', lieu: EPAC, description: "Formation en génie informatique et télécommunications à l'École polytechnique d'Abomey-Calavi.", series: ['C', 'D'] }),
  universitaire({ code: 'EPAC-GC', nom: 'Génie civil', etablissement: 'EPAC (UAC)', lieu: EPAC, description: "Formation en génie civil à l'École polytechnique d'Abomey-Calavi.", series: ['C', 'D'] }),
  universitaire({ code: 'EPAC-GEE', nom: 'Génie électrique et énergétique', etablissement: 'EPAC (UAC)', lieu: EPAC, description: "Formation en génie électrique et énergétique à l'École polytechnique d'Abomey-Calavi.", series: ['C', 'D'] }),
  universitaire({ code: 'FAST-MPC', nom: 'Mathématiques, physique, chimie', etablissement: 'FAST (UAC)', lieu: FAST, description: 'Parcours de sciences fondamentales : mathématiques, physique, chimie.', series: ['C', 'D'] }),
  universitaire({ code: 'FAST-SVT', nom: 'Biologie, biochimie et géologie', etablissement: 'FAST (UAC)', lieu: FAST, description: 'Parcours de sciences de la vie et de la Terre : biologie, biochimie, géologie.', series: ['C', 'D'] }),
  universitaire({ code: 'FASEG-ECONOMIE', nom: 'Sciences économiques', etablissement: 'FASEG (UAC)', lieu: FASEG, description: 'Formation en sciences économiques.', series: ['Toutes séries'] }),
  universitaire({ code: 'FASEG-GESTION', nom: 'Gestion, finance et comptabilité', etablissement: 'FASEG (UAC)', lieu: FASEG, description: 'Gestion des entreprises, finance et banque, comptabilité et audit.', series: ['Toutes séries'] }),
  universitaire({ code: 'FADESP-DROIT', nom: 'Droit et science politique', etablissement: 'FADESP (UAC)', lieu: FADESP, description: 'Droit privé, droit public, science politique, relations internationales.', series: ['A1', 'A2', 'B', 'Autres séries sous conditions'] }),
  universitaire({ code: 'FLASH-LETTRES', nom: 'Lettres, langues et philosophie', etablissement: 'FLASH (UAC)', lieu: FLASH, description: 'Lettres modernes, anglais, philosophie.', series: ['A1', 'A2'] }),
  universitaire({ code: 'FLASH-SHS', nom: 'Histoire, géographie et sciences sociales', etablissement: 'FLASH (UAC)', lieu: FLASH, description: 'Histoire, géographie et aménagement du territoire, sociologie-anthropologie, psychologie.', series: ['A1', 'A2'] }),
  universitaire({ code: 'IFRI-INFORMATIQUE', nom: 'Informatique', etablissement: 'IFRI (UAC)', lieu: IFRI, description: 'Licence en informatique.', series: ['C', 'D'], diplomes: ['Licence en informatique'] }),
  universitaire({ code: 'ENEAM-STATISTIQUE', nom: 'Statistique et planification', etablissement: 'ENEAM (UAC)', lieu: ENEAM, description: 'Formation en statistique et planification.', series: ['C', 'D', 'G2'] }),
  universitaire({ code: 'ENEAM-GESTION', nom: 'Management, administration des affaires, finances-comptabilité', etablissement: 'ENEAM (UAC)', lieu: ENEAM, description: 'Management des organisations, administration des affaires, finances-comptabilité.', series: ['C', 'D', 'G2'] }),
  universitaire({ code: 'INSTI-MAINT-INDUSTRIELLE', nom: 'Maintenance industrielle', etablissement: 'INSTI (UNSTIM)', lieu: INSTI, description: "Filière réservée aux titulaires d'un baccalauréat technique.", series: ['Baccalauréats techniques uniquement'], sources: [S.bacsTechniques] }),
  universitaire({ code: 'INSTI-MAINT-AUTOMOBILE', nom: 'Maintenance automobile', etablissement: 'INSTI (UNSTIM)', lieu: INSTI, description: "Filière réservée aux titulaires d'un baccalauréat technique.", series: ['Baccalauréats techniques uniquement'], sources: [S.bacsTechniques] }),
  universitaire({ code: 'ENSET', nom: "Professorat de l'enseignement technique", etablissement: 'ENSET (UNSTIM)', lieu: ENSET, description: "École normale formant les enseignants de l'enseignement technique ; 14 filières accessibles sur concours.", metiers: ["Professeur de l'enseignement technique"], conditions: 'Admission sur concours.', sources: [S.bacsTechniques] }),
  universitaire({ code: 'IMSP-PREPA', nom: "Classes préparatoires aux études d'ingénieur", etablissement: 'IMSP (UAC)', lieu: IMSP, description: 'Classes préparatoires ouvertes notamment aux bacheliers des séries E et F.', series: ['E', 'F1', 'F2', 'F3', 'F4'], sources: [S.bacsTechniques] }),
];
