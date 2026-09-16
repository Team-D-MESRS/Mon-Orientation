/**
 * Fiches métier des catalogues officiels des nouveaux métiers (DTM), vérifiées contre les PDF le 16/09/2026.
 *
 * Méthode (choix « semi-automatique vérifié » de l'utilisateur) :
 * - l'extraction (outils/extraire-metiers-dtm.py → metiers-dtm.json) sert de brouillon ;
 * - les listes sont reconstruites à partir des puces du PDF, colonne par colonne ;
 * - chaque texte a été confronté au PDF : il y figure tel quel, ou provient d'une reprise manuelle
 *   (prose des fiches agricoles répartie sur deux colonnes) dont chaque mot existe dans le document ;
 * - toute intervention sur le texte officiel (copier-coller du document écarté, doublon retiré, coquille
 *   corrigée, structure remise en listes) est consignée dans `remarques`.
 *
 * Les listes d'établissements du catalogue ne sont pas reprises ici : les lieux de formation viennent des
 * répertoires officiels (voir correspondances-eftp.ts).
 */

/** Élément de liste, ou groupe d'éléments sous un intertitre du document. */
export type ElementListe = string | { titre: string; elements: string[] };

export interface ContenuMetier {
  /** Catalogue d'origine et pages du PDF, pour vérification */
  catalogue: 'LTP' | 'LTA';
  pages: number[];
  /** Présentation du secteur au Bénin (catalogue LTP) */
  secteur?: string;
  /** Objectif de la formation, quand il ne répète pas le secteur (catalogue LTP) */
  objectif?: string;
  description: string;
  missions?: ElementListe[];
  competencesIntro?: string;
  competences: ElementListe[];
  qualites?: ElementListe[];
  debouches: ElementListe[];
  /** « Opportunités d'insertion » : entreprises et structures qui recrutent (catalogue LTP) */
  employeurs?: ElementListe[];
  secteursActivite?: ElementListe[];
  partenariatsIntro?: string;
  partenariats?: ElementListe[];
  /** Éléments publiés sous « partenariat » mais décrivant les perspectives de la filière */
  perspectives?: ElementListe[];
  profilSortie?: string;
  /** Rangée « diplôme / profil d'entrée / durée / âge limite » (catalogue LTP) */
  diplome?: string;
  profilEntree?: string;
  duree?: string;
  ageLimite?: string;
  /** Voies et critères d'accès, tels que publiés par le catalogue (concours, inscription à titre payant) */
  acces: string[];
  /** Interventions sur le texte officiel */
  remarques?: string[];
}

export const FICHES_METIERS: Record<string, ContenuMetier> = {
  'DTM-LTP-ELEC-ENERGIE': {
    catalogue: 'LTP',
    pages: [2, 3],
    secteur:
      "Le secteur de l’Energie et du Développement Durable au Bénin offre aujourd’hui de nombreuses opportunités : une demande forte dans le secteur public (SBEE, CEB, ANPE), des formations opérationnelles (ESMER, CFPA), et un potentiel entrepreneurial grandissant, notamment dans l'installation solaire. Avec de bonnes compétences techniques, des diplômes ou certifications et une orientation pratique, les débouchés sont nombreux — que ce soit comme salarié ou entrepreneur indépendant.",
    description:
      'Le technicien en électricité conçoit, installe, entretient et répare des systèmes électriques (résidentiels, tertiaires, industriels). Il intervient sur : les réseaux électriques (distribution, éclairage, câblage, automatismes), les équipements industriels et domestiques (moteurs, appareils électroménagers, systèmes de pompage, groupes électrogènes), les systèmes énergétiques modernes (solaire photovoltaïque, domotique, automatisation).',
    missions: [
      'Lire, interpréter et réaliser des schémas électriques',
      'Installer et raccorder des équipements électriques (appareillages, moteurs, câbles, disjoncteurs, panneaux solaires, etc.)',
      'Effectuer la maintenance préventive et corrective des installations électriques',
      'Réaliser des diagnostics et dépanner les pannes électriques',
      'Garantir la sécurité des installations selon les normes en vigueur',
      'Conseiller les clients sur les solutions techniques et énergétiques adaptées',
    ],
    competences: [
      'Maîtrise des schémas électriques et électroniques',
      'Connaissance des normes de sécurité électrique',
      'Techniques d’installation, câblage, raccordement',
      'Compétences en automatisme et domotique',
      'Notions en énergies renouvelables (solaire, hybride)',
      'Utilisation d’outils de mesure et de diagnostic (multimètre, pince ampèremétrique)',
      'Capacité à rédiger des rapports techniques',
    ],
    qualites: [
      'Rigueur et sens de la précision',
      'Capacité d’analyse et de résolution de problèmes',
      'Esprit d’équipe et sens de la communication',
      'Habileté manuelle et technicité',
      'Respect strict des règles de sécurité',
      'Polyvalence et capacité d’adaptation aux évolutions technologiques',
      'Goût pour l’innovation (énergies vertes, automatismes)',
    ],
    debouches: [
      'Technicien en maintenance électrique (domestique ou industriel)',
      'Technicien en maintenance industrielle (usines, zones industrielles, ateliers)',
      'Électricien du bâtiment (logements, bureaux, chantiers publics)',
      'Contrôleur d’installations électriques (sécurité, conformité)',
      'Technicien en automatisme industriel et domotique',
      'Technicien en énergies renouvelables et industrielles (solaire, éolien, hydraulique, biogaz)',
      'Technicien des travaux sous tension',
      'Monteur-câbleur (tableaux, armoires et réseaux électriques)',
    ],
    employeurs: [
      'Société Béninoise d’Énergie Électrique (SBEE)',
      'Zones industrielles (Glo-Djigbé, Sèmè City, Port Autonome)',
      'Sociétés de télécoms (MTN, MOOV, CELTIS)',
      'Entreprises de BTP (SOGEA SATOM, COGEBA, CECO BTP…)',
      'Sociétés d’installation électrique et domotique',
      'Entreprises industrielles (textile, agroalimentaire, cimenterie, brasseries, etc.)',
      'Hôtels, centres commerciaux, hôpitaux (maintenance)',
      'Offres de services en énergie solaire, câblage domestique, automatisme',
      'Chantiers publics de construction (logements sociaux, écoles, hôpitaux, stade)',
      'Agences immobilières (SIRAT, SIPIM)',
      'CEB',
      'CIMBENIN',
      'NOCIBE',
      'FLUDOR',
      'ARESS',
      'SolarKits',
      'TRANS ACIER',
      'SIAB',
      'Projets MCA-Bénin II',
    ],
    diplome: 'Diplôme de Technicien au Métier (DTM)',
    profilEntree: 'Être titulaire du CAP ou BEPC',
    ageLimite: '15 ans au moins et 19 ans au plus',
    acces: [
      'Concours ouvert aux élèves titulaires du BEPC ou du CAP ancienne formule ou de tout autre titre équivalent',
      'Inscription à titre Payant : avoir obtenu la note d’au moins dix sur vingt en Mathématiques et dix sur vingt en Physique, Chimie et Technologie à l’examen du BEPC',
    ],
    remarques: ["L'objectif de la formation publié reprend mot pour mot la présentation du secteur : non repris."],
  },
  'DTM-LTP-ENR': {
    catalogue: 'LTP',
    pages: [4, 5],
    secteur:
      "Le secteur de l’Energie et du Développement Durable au Bénin offre aujourd’hui de nombreuses opportunités : une demande forte dans le secteur public (SBEE, CEB, ANPE), des formations opérationnelles (ESMER, CFPA), et un potentiel entrepreneurial grandissant, notamment dans l'installation solaire. Avec de bonnes compétences techniques, des diplômes ou certifications et une orientation pratique, les débouchés sont nombreux — que ce soit comme salarié ou entrepreneur indépendant.",
    objectif:
      'Former des techniciens qualifiés capables d’installer, entretenir et réparer des systèmes d’énergies renouvelables (solaires photovoltaïques, solaires thermiques, mini-éoliennes, etc.) pour des applications domestiques, commerciales ou industrielles, tout en assurant l’optimisation des performances énergétiques et le respect des normes de sécurité. Le DTM Énergies Renouvelables ouvre de larges perspectives au Bénin, dans un contexte de forte demande d’électrification rurale et de transition énergétique. Les opportunités se situent dans le privé, le public, les ONG et surtout l’entrepreneuriat vert.',
    description:
      'Le technicien en énergies renouvelables intervient dans l’installation, la maintenance et la gestion des systèmes utilisant des sources d’énergie renouvelables. Il intervient sur : les systèmes solaires photovoltaïques (résidentiels, industriels, ruraux), les chauffe-eau solaires et systèmes thermiques, les minicentrales hydroélectriques de petite puissance, les systèmes éoliens, les biodigesteurs et installations de biogaz. Il contribue à la transition énergétique en favorisant des solutions durables et respectueuses de l’environnement.',
    missions: [
      'Installer, raccorder et mettre en service des systèmes solaires photovoltaïques et thermiques',
      'Effectuer la maintenance préventive et corrective des installations d’énergies renouvelables (solaire, éolien)',
      'Réaliser des bilans énergétiques et conseiller sur l’optimisation de la consommation d’énergie',
      'Participer à la conception technique de projets d’électrification rurale',
      'Garantir la sécurité des installations et le respect des normes environnementales',
    ],
    competences: [
      'Dimensionnement des systèmes photovoltaïques et thermiques',
      'Lecture de plans et de schémas électriques et solaires',
      'Maîtrise des techniques de pose de panneaux solaires, batteries, régulateurs, onduleurs, turbines, biodigesteurs',
      'Diagnostic des pannes et interventions de dépannage',
      'Suivi de la performance des installations via des outils de monitoring',
      'Application stricte des normes de sécurité électrique et environnementale',
    ],
    qualites: [
      'Rigueur et sens de la précision',
      'Bonne condition physique pour les installations de terrain',
      'Sens écologique et intérêt pour le développement durable',
      'Capacité d’analyse et de diagnostic',
    ],
    debouches: [
      'Technicien en installation solaire photovoltaïque',
      'Technicien en maintenance de systèmes solaires, éoliens, hydro ou biogaz',
      'Technicien en efficacité énergétique',
      'Installateur de systèmes solaires photovoltaïques',
      'Installateur-conseil en énergies renouvelables',
      'Technico-commercial en équipements d’énergies renouvelables',
    ],
    employeurs: [
      'SBEE (Société Béninoise d’Énergie Électrique)',
      'Ministère de l’Énergie et structures déconcentrées',
      'Entreprises de BTP intégrant des solutions énergétiques',
      'Hôtels, hôpitaux, écoles privées, centres commerciaux',
      'Projets publics d’électrification rurale',
      'ONG et partenaires techniques & financiers',
      'Programmes financés par la Banque Mondiale, l’Union Européenne, la BID, la GIZ, etc.',
      'ONG et projets communautaires d’accès à l’énergie',
      'MCA-Bénin II',
      'Agence de Développement des Énergies Renouvelables (ADER)',
      'Entreprises privées spécialisées dans les systèmes solaires (ARESS, Greenlight Planet, Soleva, Bonergie, etc.)',
      'ONG et programmes de développement (SNV, GIZ, ENABEL…)',
      'Sociétés spécialisées en solaire (importateurs, installateurs, distributeurs)',
      'TRANS ACIER',
      'SIAB',
    ],
    diplome: 'Diplôme de Technicien au Métier (DTM)',
    profilEntree: 'Être titulaire du CAP ou BEPC',
    ageLimite: '15 ans au moins et 19 ans au plus',
    acces: [
      'Concours ouvert aux élèves titulaires du BEPC ou du CAP ancienne formule ou de tout autre titre équivalent',
      'Inscription à titre Payant : avoir obtenu la note d’au moins dix sur vingt en Mathématiques et dix sur vingt en Physique, Chimie et Technologie à l’examen du BEPC',
    ],
  },
  'DTM-LTP-FROID-CLIM': {
    catalogue: 'LTP',
    pages: [6, 7],
    secteur:
      "Le secteur de l’Energie et du Développement Durable au Bénin offre aujourd’hui de nombreuses opportunités : une demande forte dans le secteur public (SBEE, CEB, ANPE), des formations opérationnelles (ESMER, CFPA), et un potentiel entrepreneurial grandissant, notamment dans l'installation solaire. Avec de bonnes compétences techniques, des diplômes ou certifications et une orientation pratique, les débouchés sont nombreux — que ce soit comme salarié ou entrepreneur indépendant.",
    objectif:
      'Former des techniciens qualifiés capables d’installer, entretenir et réparer des équipements de froid domestique, commercial ou industriel, des systèmes de climatisation et de sanitaire (plomberie, chauffe-eau, ventilation, etc.). Le DTM Froid sanitaire et conditionnement d’air offre des possibilités d’insertion professionnelle au Bénin assez larges car ce domaine est transversal (bâtiment, industrie, services, santé, commerce, etc.).',
    description:
      "Le professionnel du froid sanitaire et conditionnement d'air conçoit, installe, entretient et répare des équipements frigorifiques et des systèmes de climatisation, utilisés dans les secteurs domestique, commercial, industriel et sanitaire.",
    missions: [
      'Installer et mettre en service des systèmes de froid et climatisation (réfrigérateurs, climatiseurs, centrales frigorifiques, pompes à chaleur, etc.)',
      'Assurer la maintenance préventive et corrective des équipements pour garantir leur bon fonctionnement et leur performance énergétique',
      'Diagnostiquer les pannes et effectuer les réparations nécessaires',
      'Respecter les normes environnementales et de sécurité (gestion des fluides frigorigènes, prévention des risques électriques)',
      'Conseiller les clients sur l’utilisation et l’entretien des installations',
    ],
    competences: [
      'Maîtrise des principes thermodynamiques liés au froid et à la climatisation',
      'Connaissance des différents types de fluides frigorigènes et réglementation en vigueur',
      'Techniques d’installation, réglage et entretien des équipements',
      'Lecture et interprétation de plans et schémas techniques',
      'Utilisation des outils de diagnostic électronique et mécanique',
    ],
    qualites: [
      'Rigueur et précision dans les interventions',
      'Sens de l’organisation et gestion du temps',
      'Aptitude à travailler en autonomie et en équipe',
      'Capacité d’adaptation aux évolutions technologiques',
    ],
    debouches: [
      'Technicien frigoriste',
      'Technicien en climatisation',
      'Installateur d’équipements frigorifiques et climatiques',
      'Technicien de maintenance en froid sanitaire',
      'Monteur-dépanneur frigoriste',
      'Agent de maintenance en systèmes thermiques',
      'Responsable de service technique (petite entreprise ou atelier)',
      'Assistant chef de projet en installation de systèmes de climatisation',
      'Monteur-réparateur en froid commercial et industriel',
      'Responsable maintenance dans les entreprises spécialisées',
    ],
    employeurs: [
      'Hôpitaux, laboratoires, centres de transfusion sanguine (chaîne du froid médicale, cryoconservation)',
      'Industrie hôtelière et touristique : hôtels, restaurants, centres de loisirs (climatisation, chambres froides, cuisines professionnelles)',
      'Entreprises de construction et bureaux d’ingénierie pour l’installation de réseaux de plomberie, chauffage, climatisation centralisée',
      'Industries agroalimentaires',
      'Entreprises de maintenance frigorifique et climatisation',
      'Grandes surfaces et commerces : supermarchés, boucheries, poissonneries, qui ont besoin de vitrines réfrigérées et chambres froides',
      'ONG ou projets agricoles avec chaîne du froid',
      'Secteur public (administration, collectivités)',
      'Projets publics et internationaux : programmes liés à l’efficacité énergétique, la transition écologique, la réduction des gaz frigorigènes nocifs (HCFC)',
    ],
    diplome: 'Diplôme de Technicien au Métier (DTM)',
    profilEntree: 'Être titulaire du CAP ou BEPC',
    ageLimite: '15 ans au moins et 19 ans au plus',
    duree: 'Trois (03) ans',
    acces: [
      'Concours ouvert aux élèves titulaires du BEPC ou du CAP ancienne formule ou de tout autre titre équivalent',
      'Inscription à titre Payant : avoir obtenu la note d’au moins dix sur vingt en Mathématiques et dix sur vingt en Physique, Chimie et Technologie à l’examen du BEPC',
    ],
  },
  'DTM-LTP-MAINT-MULTIMEDIA': {
    catalogue: 'LTP',
    pages: [8, 9],
    secteur:
      "Le secteur de l’Energie et du Développement Durable au Bénin offre aujourd’hui de nombreuses opportunités : une demande forte dans le secteur public (SBEE, CEB, ANPE), des formations opérationnelles (ESMER, CFPA), et un potentiel entrepreneurial grandissant, notamment dans l'installation solaire. Avec de bonnes compétences techniques, des diplômes ou certifications et une orientation pratique, les débouchés sont nombreux que ce soit comme salarié ou entrepreneur indépendant.",
    objectif:
      'Former des techniciens polyvalents capables d’installer, configurer, entretenir et dépanner des équipements électroniques et multimédias (audio, vidéo, informatique, téléphonie, etc.). Le DTM Maintenance d’Équipements Électroniques – Option Multimédia prépare à un métier technique et porteur. Avec la montée en puissance du numérique et du multimédia au Bénin, les débouchés sont réels aussi bien dans le salariat que dans l’entrepreneuriat.',
    description:
      'Le technicien en maintenance d’équipements électroniques option multimédia assure l’installation, la configuration, le diagnostic et la réparation : d’équipements audiovisuels (TV, home cinéma, vidéoprojecteurs, amplificateurs), d’équipements informatiques et périphériques (PC, imprimantes, scanners), d’équipements de communication (téléphones, tablettes, réseaux locaux), de systèmes multimédias intégrés (salles de conférence, studios, équipements scolaires).',
    missions: [
      'Diagnostiquer les pannes des équipements électroniques et multimédias',
      'Réparer ou remplacer les composants défectueux (circuits imprimés, cartes mères, écrans, connecteurs, etc.)',
      'Effectuer la maintenance préventive pour éviter les dysfonctionnements',
      'Installer et configurer les matériels multimédias et informatiques',
      'Assurer la mise à jour des logiciels et firmwares',
    ],
    competences: [
      'Maîtrise des bases de l’électronique analogique et numérique',
      'Connaissance des systèmes audio, vidéo, informatique et réseaux',
      'Utilisation d’outils de diagnostic électronique (multimètre, oscilloscope, logiciel de test)',
      'Techniques de soudure, dépose/repose de composants',
      'Connaissance des systèmes d’exploitation (Windows, Android, iOS, etc.)',
      'Capacités de programmation et de mise à jour des appareils',
    ],
    qualites: ['Rigueur et précision dans les interventions', 'Habileté manuelle et technicité'],
    debouches: [
      'Technicien en maintenance électronique',
      'Technicien en audiovisuel et multimédia (studios, médias, salles de spectacle)',
      'Technicien de maintenance informatique et bureautique',
      'Technicien de SAV (service après-vente)',
      'Installateur ou dépanneur de systèmes électroniques',
      'Installateur de systèmes multimédias domestiques ou professionnels',
    ],
    employeurs: [
      'Boutiques et ateliers de réparation électronique',
      'Entreprises de distribution et de service après-vente (Samsung, LG, Huawei, etc.)',
      'Sociétés de communication audiovisuelle (ORTB, Canal+, radios, médias en ligne)',
      'Écoles, universités et centres de formation équipés en multimédia (EMN, SEMECITY, INFRI)',
      'Ateliers de réparation d’appareils électroménagers',
      'Sociétés de téléphonie, réseaux ou sécurité électronique (MTN, MOOV, CELTIS)',
      'Entreprises industrielles (automatisation, électronique embarquée)',
      'Entreprises de vente de matériel informatique ou multimédia',
      'Institutions (écoles, hôpitaux, administrations) disposant d’équipements multimédia',
    ],
    diplome: 'Diplôme de Technicien au Métier (DTM)',
    profilEntree: 'Être titulaire du CAP ou BEPC',
    ageLimite: '15 ans au moins et 19 ans au plus',
    acces: [
      'Concours ouvert aux élèves titulaires du BEPC ou du CAP ancienne formule ou de tout autre titre équivalent',
      'Inscription à titre Payant : avoir obtenu la note d’au moins dix sur vingt en Mathématiques et dix sur vingt en Physique, Chimie et Technologie à l’examen du BEPC',
    ],
  },
  'DTM-LTP-RESEAUX-CYBER': {
    catalogue: 'LTP',
    pages: [10, 11],
    secteur:
      'Le Numérique au Bénin est un secteur en plein essor, stratégique pour le développement économique, qui offre de larges débouchés pour les jeunes diplômés, tant en emploi salarié qu’en auto-emploi ou en entrepreneuriat innovant.',
    objectif:
      'Former des techniciens qualifiés capables de mettre en place, configurer, sécuriser et maintenir des réseaux informatiques dans des environnements professionnels, tout en assurant la protection des données et des systèmes. Le DTM Réseau et Sécurité Informatique prépare des techniciens indispensables dans le contexte actuel de digitalisation au Bénin. Les opportunités d’insertion sont nombreuses dans le privé, le public, les ONG et surtout dans l’entrepreneuriat numérique.',
    description:
      'Le Technicien en réseau et sécurité informatique conçoit, installe, configure, et maintient les infrastructures réseau d’une organisation, tout en assurant la protection des données et la sécurité des systèmes informatiques contre les cybermenaces.',
    missions: [
      'Installer et configurer les équipements réseaux (switches, routeurs, serveurs)',
      'Gérer les systèmes d’exploitation réseau (Windows Server, Linux)',
      'Assurer la maintenance et la surveillance des infrastructures',
      'Détecter et corriger les incidents de sécurité (intrusions, virus, pannes)',
      'Mettre en œuvre des solutions de sécurité (pare-feu, antivirus, VPN, sauvegardes)',
      'Administrer les comptes utilisateurs et droits d’accès',
      'Former les utilisateurs à la sécurité informatique et aux bonnes pratiques',
      'Participer à la mise en place de solutions de cloud et virtualisation',
    ],
    competences: [
      'Maîtrise des concepts de réseaux informatiques (LAN, WAN, TCP/IP)',
      'Installation et configuration de matériels (switches, routeurs, serveurs)',
      'Compétences en systèmes d’exploitation réseau (Linux, Windows Server)',
      'Sécurisation des réseaux (chiffrement, pare-feu, IDS/IPS)',
      'Utilisation d’outils de cybersécurité et d’analyse réseau (Wireshark, Kali Linux, Nmap)',
      'Connaissance en cloud computing et virtualisation (VMware, Hyper-V)',
      'Bases en développement/script pour automatisation (Python, Shell)',
    ],
    qualites: [
      'Rigueur et méthodologie',
      'Curiosité et veille technologique permanente',
      'Discrétion et sens de la confidentialité',
      'Capacité à travailler en équipe pluridisciplinaire',
    ],
    debouches: [
      'Technicien réseaux et systèmes informatiques',
      'Administrateur systèmes et réseaux',
      'Technicien support informatique (Helpdesk)',
      'Technicien en cybersécurité',
      'Gestionnaire de parc informatique',
      'Responsable maintenance informatique',
      'Entrepreneur en services numériques (TIC)',
      'Technicien de maintenance informatique et réseau',
      'Technico-commercial en équipements réseaux et solutions de sécurité informatique',
    ],
    employeurs: [
      'Entreprises publiques et privées disposant de réseaux informatiques (banques, assurances, industries, commerces)',
      'Fournisseurs d’accès Internet ou entreprises télécom (MTN, MOOV, CELTIS)',
      'Hôpitaux, écoles, mairies, administrations',
      'Sociétés de maintenance informatique et cybersécurité',
      'Startups du digital (e-commerce, fintech cloud)',
      'Cabinets d’audit informatique et cybersécurité',
      'Entreprises de services numériques (ESN) et fournisseurs d’accès Internet (ISP)',
      'Projets liés à la cybersécurité régionale (UEMOA, CEDEAO)',
      'Programmes d’appui à la transformation numérique financés par la Banque Mondiale, la BAD, l’UE, ...',
    ],
    diplome: 'Diplôme de Technicien au Métier (DTM)',
    profilEntree: 'Être titulaire du CAP ou BEPC',
    ageLimite: '15 ans au moins et 19 ans au plus',
    acces: [
      'Concours ouvert aux élèves titulaires du BEPC ou du CAP ancienne formule ou de tout autre titre équivalent',
      'Inscription à titre Payant : avoir obtenu la note d’au moins dix sur vingt en Mathématiques et dix sur vingt en Physique, Chimie et Technologie à l’examen du BEPC',
    ],
  },
  'DTM-LTP-MECA-AUTO': {
    catalogue: 'LTP',
    pages: [12, 13],
    secteur:
      'Le secteur Automobile et Équipements industriels au Bénin est en pleine expansion et offre de nombreuses opportunités d’emploi et d’entrepreneuriat. Les diplômés de DTM dans la maintenance automobile, électronique et industrielle ont un fort potentiel d’insertion, aussi bien comme salariés dans des ateliers et industries que comme entrepreneurs indépendants.',
    objectif:
      'Former des techniciens qualifiés capables de diagnostiquer, entretenir et réparer les systèmes mécaniques, électriques et électroniques des véhicules particuliers, en tenant compte des évolutions technologiques, des normes de sécurité et des exigences environnementales. Le DTM Maintenance de Voitures Particulières ouvre la voie à un métier essentiel et en forte demande au Bénin. Entre le salariat dans des garages/concessions, l’auto-emploi et les opportunités liées à la digitalisation des diagnostics automobiles, les perspectives d’insertion sont très favorables.',
    description:
      'Le technicien en maintenance des voitures particulières (ou mécanicien automobile) assure : l’entretien préventif (vidange, révision, réglages), le diagnostic électronique des pannes, la réparation mécanique, électrique et électronique, l’installation d’équipements automobiles modernes (alarmes, climatisation, multimédia).',
    missions: [
      'Diagnostiquer les dysfonctionnements mécaniques, électriques et électroniques des véhicules',
      'Effectuer la réparation et le remplacement des pièces défectueuses (moteur, transmission, systèmes de freinage, direction, suspension, etc.)',
      'Réaliser la maintenance préventive (vidange, contrôles de routine, réglages) pour éviter les pannes',
      'Assurer la maintenance des systèmes électroniques embarqués (ABS, ESP, airbag, gestion moteur)',
      'Effectuer les opérations de contrôle technique et de mise en conformité',
      'Utiliser des outils de diagnostic électroniques (valise de diagnostic, multimètre, logiciels spécialisés)',
    ],
    competences: [
      'Maîtrise des systèmes mécaniques et électromécaniques des véhicules',
      'Connaissance approfondie des circuits électriques et électroniques automobiles',
      'Capacité d’utiliser les appareils de diagnostic électronique',
      'Aptitude à suivre les plans, schémas techniques et manuels de réparation',
      'Connaissance des normes de sécurité, d’environnement et de contrôle technique',
      'Notions de maintenance des véhicules hybrides et électriques',
    ],
    qualites: [
      'Rigueur et méthode dans les interventions techniques',
      'Précision et dextérité manuelle',
      'Esprit d’équipe et bon relationnel avec les clients',
    ],
    debouches: [
      'Technicien de maintenance automobile multimarque',
      'Mécanicien-dépanneur de voitures',
      'Technicien en diagnostic électronique auto',
      'Réparateur de systèmes automobiles (moteur, frein, électricité, injection)',
      'Chef d’atelier ou assistant en garage professionnel',
      'Contrôleur technique automobile',
      'Mécanicien-diagnosticien dans les concessions automobiles',
    ],
    employeurs: [
      'Concessions automobiles (Toyota, CFAO Motors, Nissan, Hyundai, etc.)',
      'Garages modernes et ateliers de diagnostic (STEM, AFRIKI,OSCAR Service,Auto Service la Patience, Auto Stop, AUTO ZONE, SOCAR BENIN)',
      'Entreprises de transport',
      'Sociétés de location de véhicules',
      'Taxis urbains',
      'Assureurs (expertise des véhicules accidentés)',
      'Stations-service avec atelier mécanique',
      'Parc automobile de l’État (maintenance de véhicules officiels)',
    ],
    diplome: 'Diplôme de Technicien au Métier (DTM)',
    profilEntree: 'Être titulaire du CAP ou BEPC',
    ageLimite: '15 ans au moins et 19 ans au plus',
    acces: [
      'Concours ouvert aux élèves titulaires du BEPC ou du CAP ancienne formule ou de tout autre titre équivalent',
      'Inscription à titre Payant : avoir obtenu la note d’au moins dix sur vingt en Mathématiques et dix sur vingt en Physique, Chimie et Technologie à l’examen du BEPC',
    ],
  },
  'DTM-LTP-GROS-OEUVRE': {
    catalogue: 'LTP',
    pages: [14, 15],
    secteur:
      'Le secteur du BTP au Bénin est dynamique, porteur et en croissance, offrant de nombreux débouchés aux diplômés du DTM dans les métiers du bâtiment et des travaux publics, aussi bien comme salariés que comme entrepreneurs.',
    objectif:
      'Former des techniciens de chantier capables de participer à la construction, la rénovation et la réhabilitation d’ouvrages de bâtiment et de génie civil. Développer des compétences en lecture de plans, organisation et suivi de chantiers, utilisation de matériaux et techniques modernes. Le DTM Réalisation de Gros Œuvres ouvre des perspectives solides dans un secteur en pleine expansion au Bénin. Les diplômés peuvent aussi bien s’insérer dans les grandes entreprises de BTP que créer leurs propres structures pour répondre à la demande en logements et infrastructures.',
    description:
      'Le technicien en réalisation de gros œuvre intervient dans la phase principale de construction des bâtiments. Il exécute les travaux qui constituent la structure solide et résistante de l’ouvrage, tels que les fondations, murs porteurs, planchers, poutres, poteaux, dalles, etc. Son travail garantit la stabilité, la sécurité et la durabilité des bâtiments.',
    missions: [
      'Lire et interpréter des plans d’architecture et de structures',
      'Préparer et organiser les chantiers de gros œuvre (matériaux, matériels, équipes)',
      'Réaliser les travaux de terrassement, de fondations, d’élévation des murs, de coffrage, de ferraillage et de bétonnage',
      'Assurer le suivi de l’exécution des ouvrages conformément aux normes techniques et de sécurité',
      'Effectuer le contrôle qualité des ouvrages (aplomb, niveaux, alignements)',
      'Collaborer avec les autres corps de métier (charpentiers, électriciens, plombiers) pour le bon déroulement des chantiers',
    ],
    competences: [
      'Lecture et interprétation des plans de construction et des documents d’exécution',
      'Maîtrise des techniques de maçonnerie, coffrage, béton armé, charpente, étanchéité',
      'Maîtrise des méthodes de construction des murs en briques, parpaings, pierres',
      'Connaissance des normes de sécurité sur les chantiers',
      'Utilisation des équipements de chantier (niveaux laser, bétonnières, outils de levage)',
      'Aptitude à organiser les postes de travail et les flux de matériaux',
      'Sens du contrôle qualité des ouvrages exécutés',
    ],
    qualites: [
      'Rigueur et précision dans l’exécution des ouvrages',
      'Bonne condition physique et résistance à l’effort',
      'Sens de la sécurité et du respect des normes',
    ],
    debouches: [
      'Technicien de chantier',
      'Chef d’équipe maçonnerie',
      'Conducteur de travaux',
      'Technicien en bureau d’études (quantitatif, préparation de chantier)',
      'Entrepreneur en construction de bâtiments et infrastructures',
      'Technicien de suivi et contrôle des travaux de construction',
    ],
    employeurs: [
      'Entreprises locales de BTP',
      'Grandes entreprises de construction (Sogea Satom, EBOMAF, entreprises chinoises, etc.)',
      'Cabinets d’architectes et de bureaux d’études techniques',
      'Projets de construction de logements sociaux et d’infrastructures (routes, ponts, écoles, hôpitaux)',
      'Activité indépendante (maçonnerie, construction de maisons individuelles)',
      'Sociétés spécialisées en décoration intérieure',
      'Ateliers d’artisans et PME de bâtiment',
    ],
    diplome: 'Diplôme de Technicien au Métier (DTM)',
    profilEntree: 'Être titulaire du CAP ou BEPC',
    ageLimite: '15 ans au moins et 19 ans au plus',
    duree: 'Trois (03) ans',
    acces: [
      'Concours ouvert aux élèves titulaires du BEPC ou du CAP ancienne formule ou de tout autre titre équivalent',
      'Inscription à titre Payant : avoir obtenu la note d’au moins dix sur vingt en Mathématiques et dix sur vingt en Physique, Chimie et Technologie à l’examen du BEPC',
    ],
  },
  'DTM-LTP-TOPOGRAPHIE': {
    catalogue: 'LTP',
    pages: [16, 17],
    secteur:
      'Le secteur du BTP au Bénin est dynamique, porteur et en croissance, offrant de nombreux débouchés aux diplômés du DTM dans les métiers du bâtiment et des travaux publics, aussi bien comme salariés que comme entrepreneurs.',
    objectif:
      'Former des techniciens capables de réaliser des levés topographiques, établir des plans et cartes, et participer aux opérations de bornage et de délimitation foncière, en maîtrisant les techniques de mesure, les outils informatiques et les normes réglementaires. Le DTM Géomètre-Topographe offre de vastes débouchés au Bénin, tant dans le secteur public (cadastre, urbanisme, aménagement) que privé (BTP, cabinets de géomètres, bureaux d’études). Il est aussi une porte d’entrée vers l’auto-emploi grâce à la forte demande en plans fonciers et relevés topographiques.',
    description:
      'Le géomètre-topographe est un professionnel des mesures et de la représentation du territoire. Il intervient dans : le relevé et la délimitation de terrains, la réalisation de plans et cartes, l’appui aux travaux de génie civil, routes, bâtiments, hydraulique et aménagements fonciers. Il joue un rôle clé dans la gestion du foncier, la planification urbaine et les projets d’infrastructures.',
    missions: [
      'Effectuer des levés topographiques sur le terrain à l’aide d’instruments de mesure (station totale, GPS, niveaux)',
      'Collecter et traiter des données précises sur les altitudes, distances et positions géographiques',
      'Établir des plans, cartes et modèles numériques du terrain',
      'Contrôler l’implantation et l’alignement des ouvrages de BTP',
      'Participer à la délimitation des propriétés foncières et aux bornages',
      'Veiller au respect des normes techniques et juridiques liées à la topographie et au foncier',
    ],
    competences: [
      'Maîtrise des techniques de mesure topographique et de géométrie (GPS différentiel, théodolite, station totale, drone de cartographie)',
      'Connaissance en géodésie, cartographie et SIG (Systèmes d’Information Géographique)',
      'Connaissance des outils et logiciels de dessin assisté par ordinateur (DAO/CAO)',
      'Connaissance du droit foncier et des réglementations en vigueur',
    ],
    qualites: [
      'Rigueur scientifique et précision dans les mesures',
      'Sens de l’observation et méthode',
      'Intérêt pour les nouvelles technologies de mesure et de cartographie',
    ],
    debouches: [
      'Technicien géomètre-topographe dans des cabinets de géomètres ou bureaux d’études',
      'Technicien SIG/cartographe',
      'Assistant ingénieur en BTP, routes et ouvrages d’art',
      'Contrôleur foncier ou technique dans des services de cadastre',
      'Agent technique en urbanisme et aménagement du territoire',
      'Topographe de chantier dans les entreprises de construction et grands travaux',
    ],
    employeurs: [
      'Direction du Cadastre et des Affaires Foncières',
      'Agence Nationale du Domaine et du Foncier (ANDF)',
      'Ministère du Cadre de Vie, de l’Urbanisme et de l’Aménagement du Territoire',
      'Cabinets de géomètres-experts',
      'Bureaux d’ingénierie et de topographie',
      'Cabinets privés spécialisés en expertise foncière, bornage et topographie',
      'Entreprises réalisant des infrastructures routières, bâtiments, ponts',
      'Entreprises de construction nécessitant des levés topographiques précis',
      'Agences de planification urbaine',
      'Services cadastraux, fonciers, urbanisme et aménagement des communes, départements ou régions',
      'Offices publics de gestion foncière et logement',
      'Organismes publics de cartographie et géomatique',
      'Agences nationales ou régionales en cartographie, géodésie, et gestion des données spatiales',
    ],
    diplome: 'Diplôme de Technicien au Métier (DTM)',
    profilEntree: 'Être titulaire du CAP ou BEPC',
    ageLimite: '15 ans au moins et 19 ans au plus',
    acces: [
      'Concours ouvert aux élèves titulaires du BEPC ou du CAP ancienne formule ou de tout autre titre équivalent',
      'Inscription à titre Payant : avoir obtenu la note d’au moins dix sur vingt en Mathématiques et dix sur vingt en Physique, Chimie et Technologie à l’examen du BEPC',
    ],
  },
  'DTM-LTP-ETUDES-BATIMENT': {
    catalogue: 'LTP',
    pages: [18, 19],
    secteur:
      'Le secteur du bâtiment au Bénin est dynamique et porteur, offrant de nombreux débouchés aux diplômés des DTM liés au BTP, que ce soit pour le salariat dans les entreprises et bureaux d’études, ou pour l’entrepreneuriat indépendant dans la construction, le suivi de chantier et la promotion immobilière.',
    objectif:
      'Former des techniciens capables de réaliser les études techniques et économiques nécessaires à la conception et à la réalisation d’ouvrages de bâtiment, en maîtrisant les outils de dessin assisté par ordinateur, les techniques de métré et les principes de l’économie de la construction. Le DTM Technicien d’Études du Bâtiment prépare à des métiers très demandés au Bénin dans le contexte de l’urbanisation et de la croissance du BTP. Les débouchés existent aussi bien dans le privé (bureaux d’études, entreprises de construction) que dans le public (services techniques) et l’auto-emploi (plans, devis, assistance technique).',
    description:
      "Le technicien en études du bâtiment participe à la conception technique des projets de construction (bâtiments, ouvrages de génie civil). Il réalise les plans d'exécution, les métrés (quantités de matériaux), les devis, et suit la coordination technique des projets. Il travaille en lien avec les architectes, ingénieurs et chefs de chantier.",
    missions: [
      'Réaliser les plans techniques et dessins de bâtiment à partir des esquisses de l’architecte',
      'Effectuer les métrés (quantification des matériaux nécessaires)',
      'Établir les devis estimatifs et quantitatifs',
      'Concevoir les documents d’exécution (plans, coupes, détails techniques)',
      'Collaborer avec les bureaux d’études techniques (BET) pour intégrer les aspects structurels, électriques, sanitaires, etc.',
      'Suivre l’évolution du chantier en veillant à la conformité des réalisations par rapport aux plans',
    ],
    competences: [
      'Maîtrise des logiciels DAO/CAO (AutoCAD, Revit, ArchiCAD, Covadis)',
      'Connaissance des techniques de construction, matériaux, normes et règlementations',
      'Capacité à lire et interpréter des plans architecturaux et techniques',
      'Compétences en résistance des matériaux, techniques de construction et normes BTP',
      'Bonne maîtrise des réglementations de sécurité et d’urbanisme',
    ],
    qualites: [
      'Rigueur et précision dans le travail',
      'Esprit d’analyse et de synthèse',
      'Bonne organisation et sens de la planification',
      'Créativité dans la conception technique',
      'Capacité à travailler en équipe pluridisciplinaire',
      'Sens des responsabilités et respect des délais',
    ],
    debouches: [
      'Dessinateur-projeteur en bâtiment',
      'Technicien métreur',
      'Technicien d’études en cabinet d’architecture',
      'Chargé d’études techniques dans un bureau d’études (BET)',
      'Technicien d’économie de la construction',
      'Assistant conducteur de travaux',
      'Contrôleur technique dans les entreprises de BTP',
      'Technicien en suivi de chantier',
    ],
    employeurs: [
      'Grandes entreprises de BTP (SOGEA, SATOM, OFMAS, COLAS)',
      'SONAB',
      'Ateliers de menuiserie et d’ébénisterie',
      'Industries du bois (ATC BEKO)',
      'Ministère du Cadre de Vie et de l’Urbanisme',
      'Cabinets d’architectes',
      'Bureaux d’études techniques (BET)',
      'Entreprises de construction et de promotion immobilière',
      'Sociétés de maîtrise d’œuvre',
      'Collectivités locales (services techniques des mairies, directions des infrastructures)',
      'Organismes publics d’urbanisme et de planification',
      'Grandes entreprises de BTP (secteur privé et public)',
    ],
    diplome: 'Diplôme de Technicien au Métier (DTM)',
    profilEntree: 'Être titulaire du CAP ou BEPC',
    ageLimite: '15 ans au moins et 19 ans au plus',
    acces: [
      'Concours ouvert aux élèves titulaires du BEPC ou du CAP ancienne formule ou de tout autre titre équivalent',
      'Inscription à titre Payant : avoir obtenu la note d’au moins dix sur vingt en Mathématiques et dix sur vingt en Physique, Chimie et Technologie à l’examen du BEPC',
    ],
    remarques: ['Parenthèse non refermée dans le document (« SOGEA, SATOM, OFMAS, COLAS ») : refermée.'],
  },
  'DTM-LTP-ACCUEIL-TOURISTIQUE': {
    catalogue: 'LTP',
    pages: [20, 21],
    secteur:
      'Le secteur du tourisme au Bénin est porteur et diversifié, offrant de nombreuses opportunités pour les diplômés des DTM liés à l’accueil, l’animation et l’hôtellerie. Les jeunes peuvent intégrer des structures publiques ou privées, ou développer des initiatives entrepreneuriales locales pour valoriser le patrimoine national.',
    objectif:
      'Former des techniciens compétents dans l’accueil, l’orientation et l’assistance des visiteurs. Développer des compétences en communication, gestion de l’information et promotion des destinations. Répondre aux besoins croissants du secteur du tourisme et de l’hôtellerie au Bénin. Valoriser le patrimoine culturel, historique et naturel du pays par un accueil de qualité. Le DTM Accueil Touristique prépare à des métiers de contact direct avec le public, essentiels pour le développement du tourisme béninois. Les diplômés peuvent travailler aussi bien dans les structures publiques que privées, avec de réelles opportunités d’auto-emploi et d’innovation dans le tourisme communautaire et culturel.',
    description:
      'Le technicien en accueil touristique est un professionnel chargé de recevoir, informer et assister les touristes, aussi bien dans les sites touristiques que dans les agences de voyages, les hôtels ou les structures culturelles. Il joue un rôle essentiel dans la valorisation de l’image du pays, en offrant des services d’accueil chaleureux, organisés et adaptés aux besoins des visiteurs.',
    missions: [
      'Accueillir, informer et orienter les touristes',
      'Fournir des renseignements sur les sites, circuits et événements culturels',
      'Promouvoir et valoriser les produits et destinations touristiques',
      'Gérer les réservations, inscriptions et billetteries (visites, circuits, événements)',
      'Accompagner les visiteurs lors de circuits ou activités touristiques',
      'Assurer l’interface entre les touristes et les prestataires de services (guides, hôtels, transports, restaurants)',
      'Participer à l’organisation d’événements touristiques, foires et expositions',
    ],
    competences: [
      'Maîtrise des techniques d’accueil et de communication',
      'Bonne connaissance du patrimoine culturel, historique et naturel du Bénin',
      'Compétences en organisation de visites et circuits touristiques',
      'Connaissances en gestion de réservations et billetterie',
      'Notions en marketing touristique et promotion de destination',
    ],
    qualites: [
      'Sens de l’accueil et excellente présentation',
      'Bonne expression orale et écrite',
      'Capacité d’adaptation à des publics diversifiés',
      'Rigueur dans la gestion des informations et réservations',
      'Compétences linguistiques (français, anglais, langues locales, éventuellement espagnol ou allemand).t',
    ],
    debouches: [
      'Agent d’accueil dans les sites touristiques et musées',
      'Assistant dans les agences de voyages et de tourisme',
      'Réceptionniste dans les hôtels, auberges, centres de loisirs et de congrès',
      'Animateur dans les villages et structures touristiques',
      'Hôte(sse) d’accueil dans les événements culturels, expositions et foires',
      'Collaborateur dans les offices de tourisme et centres d’information touristique',
    ],
    employeurs: [
      'Agences de voyages et de tourisme',
      'Hôtels, complexes hôteliers, auberges et restaurants',
      'Musées, parcs, villages touristiques et centres de loisirs',
      'Compagnies de transport touristique (terrestre, fluvial, aérien)',
      'Office National du Tourisme du Bénin (ONTB)',
      'Directions départementales du tourisme',
      'Musées et institutions culturelles publiques',
    ],
    diplome: 'Diplôme de Technicien au Métier (DTM)',
    profilEntree: 'Être titulaire du CAP ou BEPC',
    ageLimite: '15 ans au moins et 19 ans au plus',
    acces: [
      'Concours ouvert aux élèves titulaires du BEPC ou du CAP ancienne formule ou de tout autre titre équivalent',
      'Inscription à titre Payant : avoir obtenu la note d’au moins dix sur vingt en Mathématiques et dix sur vingt en Physique, Chimie et Technologie à l’examen du BEPC',
    ],
  },
  'DTM-LTP-BOIS': {
    catalogue: 'LTP',
    pages: [22, 23],
    secteur:
      'Le secteur du bois occupe une place essentielle dans l’économie béninoise. Il englobe aussi bien la transformation artisanale que la production industrielle, allant de la menuiserie traditionnelle à la fabrication moderne de mobiliers et d’équipements en bois destinés à l’habitat, aux bureaux, aux infrastructures scolaires, hôtelières et touristiques. Avec l’urbanisation croissante et le développement du BTP, la demande en produits en bois (portes, fenêtres, meubles, agencements intérieurs, équipements scolaires) ne cesse d’augmenter.',
    objectif:
      'Former des techniciens capables de concevoir, fabriquer, installer et entretenir des ouvrages et équipements en bois, en respectant les normes techniques, esthétiques, économiques et environnementales. Le DTM Fabrication et équipement en bois offre donc aux jeunes diplômés une insertion facilitée dans le secteur du BTP, de l’ameublement, du design intérieur et de l’artisanat modernisé, avec de fortes perspectives d’entrepreneuriat.',
    description:
      "Le technicien en fabrication et équipements en bois conçoit, fabrique et installe des éléments en bois destinés à l’aménagement intérieur et extérieur des bâtiments (portes, fenêtres, placards, meubles sur mesure, habillages muraux, etc.). Il intervient principalement en atelier pour la fabrication, mais aussi sur site pour la pose et l'installation.",
    missions: [
      'Lire et interpréter les plans et dessins techniques d’architectes ou de bureaux d’études',
      'Choisir les essences de bois et matériaux dérivés adaptés (panneaux MDF, contreplaqué, stratifiés)',
      'Réaliser la découpe, l’usinage, l’assemblage et le montage des éléments de menuiserie',
      'Travailler sur machines-outils à commande numérique (scies, raboteuses, défonceuses, CNC)',
      'Assurer la finition des ouvrages (ponçage, vernissage, laquage)',
      'Effectuer la pose sur site (portes, fenêtres, meubles intégrés, plafonds décoratifs)',
      'Réaliser des travaux de rénovation et d’entretien d’éléments bois',
    ],
    competences: [
      'Maîtrise des techniques de menuiserie et fabrication d’éléments bois',
      'Connaissance des matériaux (bois massif, dérivés, composites)',
      'Savoir lire un plan technique et travailler avec précision',
      'Utilisation des machines-outils traditionnelles et numériques (CNC)',
      'Sens de l’esthétique et du détail',
      'Respect des règles de sécurité et de qualité',
    ],
    qualites: [
      'Rigueur et précision dans l’exécution des ouvrages',
      'Bonne condition physique et résistance à l’effort',
      'Sens de la sécurité et du respect des normes',
      'Sens de précision',
    ],
    debouches: [
      'Menuisier fabricant (atelier de menuiserie artisanale ou industrielle)',
      'Technicien en agencement d’espaces (intérieurs et extérieurs)',
      'Fabricant et installateur d’équipements bois (portes, fenêtres, escaliers, placards)',
      'Ouvrier spécialisé en finition et décoration bois',
      'Technicien en menuiserie industrielle (production en série de mobilier et éléments bois)',
      'Artisan indépendant en menuiserie et agencement',
      'Fabrication et pose de menuiseries (portes, fenêtres, escaliers, mobilier intégré)',
      'Agencement d’espaces (bureaux, magasins, hôtels, maisons)',
      'Production industrielle d’éléments bois et dérivés',
      'Rénovation et restauration d’ouvrages bois',
      'Design d’espaces et décoration intérieure',
    ],
    employeurs: [
      'Ateliers de menuiserie artisanale',
      'Entreprises de menuiserie industrielle et d’agencement',
      'Sociétés de promotion immobilière et construction',
      'Entreprises d’aménagement intérieur (bureaux, commerces, hôtels)',
      'Collectivités territoriales (bâtiments publics, équipements scolaires, culturels)',
      'ONG et projets de développement locaux (mobilier scolaire, centres de santé)',
    ],
    diplome: 'Diplôme de Technicien au Métier (DTM)',
    profilEntree: 'Être titulaire du CAP ou BEPC',
    ageLimite: '15 ans au moins et 19 ans au plus',
    duree: 'Trois (03) ans',
    acces: [
      'Concours ouvert aux élèves titulaires du BEPC ou du CAP ancienne formule ou de tout autre titre équivalent',
      'Inscription à titre Payant : avoir obtenu la note d’au moins dix sur vingt en Mathématiques et dix sur vingt en Physique, Chimie et Technologie à l’examen du BEPC',
    ],
  },
  'DTM-LTA-AVICULTURE': {
    catalogue: 'LTA',
    pages: [3, 4],
    description:
      'Le titulaire du DTM « Aviculture, cuniculture et élevages non conventionnels » est chargé de l’élevage intensif ou semi-intensif de volaille de chair (poulet, canards, pintade, dindon), des pondeuses et des lapins, ainsi que d’autres élevages non conventionnels (aulacodes, caille, escargot…). Il est chargé aussi de procéder à une transformation primaire et un conditionnement de sa production pour en faciliter la commercialisation. Ce métier doit s’exercer dans le respect des normes de biosécurité, d’hygiène et de sauvegarde de l’environnement.',
    competences: [
      'Assurer les productions (volailles, lapins, aulacode, escargot…)',
      'Assurer une alimentation durable des animaux',
      'Assurer la gestion sanitaire des bâtiments et autres infrastructures d’élevage',
      'Gérer les conditions d’ambiance des bâtiments et des autres infrastructures d’élevage',
      'Gérer les stocks d’intrants et de produits finis',
      'Veiller à l’état sanitaire des animaux',
      'Conduire la reproduction des lapins, des aulacodes des escargots…',
      'Gérer les conditions d’ambiance des bâtiments et des autres infrastructures d’élevage',
      'Assurer la commercialisation des produits',
      'Appliquer les règles d’hygiène, de santé, de sécurité et de protection de l’environnement',
      'Conduire l’opération d’abattage et de transformation des viandes',
    ],
    competencesIntro: 'Le détenteur du DTM Aviculture et ENC a les compétences professionnelles suivantes :',
    debouches: [
      'Installation, conduite et gestion de son propre élevage avicole ou cunicole',
      'Gestion d’un élevage intensif ou semi-intensif d’une ferme privée ou coopérative',
      'Technicien recruté par le MAEP pour l’encadrement technique des aviculteurs et autre éleveurs non conventionnels',
      'Possibilité de poursuite des études pour l’obtention du DTSM, de la licence ou du master professionnel dans différents instituts et écoles de formation agricole des universités publiques et privées',
    ],
    secteursActivite: [
      'Secteur de l’élevage de volaille',
      'Secteur de production des œufs de table',
      'Secteur de l’élevage cunicole',
      'Secteur de commercialisation de la viande de l’élevage à cycle court (poulet, pintade, aulacode et escargot)',
      'Secteur de production et commercialisation de la provende des espèces à cycle court (volaille, lapin, aulacode)',
      'Associations des producteurs avicoles ou cunicoles',
    ],
    partenariats: [
      'Partenariat avec les fermes privées d’élevage avicole et d’élevage non conventionnel',
      'Partenariat avec les structures étatiques d’encadrement des aviculteurs (ATDA, DDAEP, DE, ...)',
      'Partenariat avec les organisations professionnelles des aviculteurs et cuniculteurs',
    ],
    profilSortie:
      'Titulaire du Diplôme de Technicien au Métier d’aviculteur et autres élevages non conventionnels après trois ans de formation modulaire (modules d’enseignement général, modules d’enseignement spécifique, modules stage et incubation au niveau de l’Unité Économique à Vocation Pédagogique UEVP)',
    acces: [
      'L’accès à la formation se fait par deux voies : la voie du concours donnant droit à une bourse de l’État et la voie des inscriptions à titre payant (ITP) après une sélection sur la base d’un dossier d’inscription',
      'Être titulaire du BEPC ou du BEAT ou d’un diplôme équivalent ; avoir entre 14 et 18 ans pour le concours et entre 14 et 24 ans pour l’inscription à titre payant',
    ],
  },
  'DTM-LTA-BOVINS': {
    catalogue: 'LTA',
    pages: [5, 6],
    description:
      'L’éleveur de ruminants est un professionnel de l’agriculture spécialisé dans l’élevage des animaux herbivores tels que les bovins, les caprins et les ovins. Son activité consiste à assurer le bien-être des animaux, leur alimentation, leur reproduction et leur santé ; tout en gérant la production (lait, viande, peau, etc.) et sa transformation (fromage, saucisse, beurre, etc.) ; la gestion du pâturage (naturel et artificiel) et l’exploitation agricole dans sa globalité. Il peut travailler dans des exploitations de tailles variables (en élevage intensif, semi-intensif, extensif). Le métier exige une présence quotidienne, car les animaux doivent être nourris et soignés tous les jours, week-ends et jours fériés compris.',
    competences: [
      'Gérer une exploitation de production des ruminants (planification, budget, logistique)',
      'Installer l’élevage des ruminants (embouche et autres productions)',
      'Assurer l’alimentation, la reproduction et les soins vétérinaires de base',
      'Utiliser le matériel agricole et d’outils numériques de suivi des animaux',
      'Installer un espace fourrager tout en assurant sa gestion',
      'Assurer la vente des produits de l’exploitation',
    ],
    debouches: [
      'Éleveur de bovins, caprins ou ovins en exploitation personnelle, familiale ou coopérative',
      'Chef d’exploitation agricole',
      'Salarié agricole dans une ferme d’élevage',
      'Technicien en élevage ou conseiller agricole dans les structures (MAEP, ATDA, ONG, coopératives, etc.)',
      'Responsable de production dans une exploitation agroalimentaire',
      'Transformateur / vendeur de produits fermiers (fromages, viande, …)',
      'Entrepreneur en fabrication d’aliments pour ruminants',
      'Agent d’abattoirs et unités de transformation de viande de ruminants',
      'Commerçant et distributeurs de produits de ruminants',
    ],
    secteursActivite: [
      'Exploitations bovines, ovines et caprines familiales, semi-intensives ou industrielles',
      'Fermes d’élevage privées ou centres zootechniques',
      'Coopératives ou unions de producteurs de bovins et de petits ruminants',
      'Projets et ONG intervenant dans l’élevage ou la sécurité alimentaire',
      'Entreprises de fabrication d’aliments pour ruminants',
      'Cliniques ou structures vétérinaires de proximité',
      'Abattoirs et unités de transformation de viande de ruminants',
      'Marchés urbains et circuits de distribution de produits de ruminants',
    ],
    partenariats: [
      'Structures privées et publiques (ATDA, DDAEP, DEDRAS ONG, etc.)',
      'Fermes d’Etats',
      'Exploitations privées (Ferme d’Elevage de l’Okpara, Ferme d’Elevage de Bètekoukou, Ferme de Sokounon, Ferme Sans Frontière, Ferme de KDK, Environnement Tropical etc.)',
    ],
    acces: [
      'Concours ouverts aux titulaires du BEPC ou BEAT ou diplôme équivalent ; âge limite : 15 ans au moins et 20 ans au plus',
      'Inscriptions à titre payant ouvertes aux titulaires du BEPC ou BEAT ou diplôme équivalent ; âge limite : 15 ans au moins et 25 ans au plus',
    ],
    remarques: [
      'Le profil de sortie publié est celui de la fiche aviculture, et tronqué (copier-coller du document) : non repris.',
      'Les compétences sont introduites par « Le détenteur du DTM Aviculture et ENC a les compétences suivantes » (copier-coller) : introduction non reprise.',
    ],
  },
  'DTM-LTA-PORCINS': {
    catalogue: 'LTA',
    pages: [7, 8],
    description:
      'Le secteur de l’élevage de porcs au Bénin est une activité importante pour l’économie, contribue à la sécurité alimentaire en fournissant de la viande de porc. Il offre également des opportunités économiques aux éleveurs et contribue à la création de l’emploi dans le secteur agricole, avec aujourd’hui de nombreuses opportunités : une demande forte dans le secteur privé (fermes d’élevage porcin) et un potentiel entrepreneurial grandissant, notamment dans l’auto-emploi.',
    competences: [
      'conduire un élevage porcin moderne (de la reproduction à l’engraissement)',
      'assurer la santé animale et l’alimentation des porcs',
      'optimiser la productivité et la rentabilité des exploitations',
      'contribuer au développement des chaînes de valeur porcines au Bénin',
    ],
    competencesIntro: 'Le DTM en Élevage de Porcs forme des techniciens spécialisés capables de :',
    debouches: [
      'Technicien d’élevage porcin',
      'Responsable de ferme ou chef de troupeau',
      'Agent zootechnique ou conseiller en élevage',
      'Animateur d’organisation paysanne ou de projet porcin',
      'Technicien de suivi sanitaire (en lien avec vétérinaires)',
      'Technico-commercial en intrants ou aliments pour bétail',
      'Entrepreneur en production ou transformation porcine',
    ],
    secteursActivite: [
      'Exploitations porcines familiales, semi-intensives ou industrielles',
      'Fermes d’élevage privées ou centres zootechniques',
      'Coopératives ou unions de producteurs porcins',
      'Projets et ONG intervenant dans l’élevage ou la sécurité alimentaire',
      'Entreprises de fabrication d’aliments pour porcs',
      'Cliniques ou structures vétérinaires de proximité',
      'Abattoirs et unités de transformation de viande porcine',
      'Marchés urbains et circuits de distribution de produits porcins',
    ],
    profilSortie: 'Diplôme de Technicien au Métier d’élevage de porcs',
    acces: [
      'Concours ouverts aux titulaires du BEPC ou BEAT ou diplôme équivalent ; âge limite : 15 ans au moins et 20 ans au plus',
      'Inscription à titre payant, pour le titulaire du BEPC : obtenir une moyenne annuelle d’au moins dix sur vingt en mathématiques et dix sur vingt en sciences de la vie et de la Terre (SVT)',
      'Inscription à titre payant, pour le titulaire du BEAT en production végétale : obtenir une moyenne annuelle d’au moins dix sur vingt en mathématiques et dix sur vingt en agriculture spéciale',
    ],
    remarques: [
      'La description publiée s’achève sur une phrase coupée (« les débouchés… ») : la fin est omise et les deux phrases précédentes sont reliées.',
      'La rubrique « Partenariat avec le milieu professionnel » décrit en réalité les perspectives de la filière : reprise comme telle.',
    ],
    perspectives: [
      'Filière en forte croissance dans les zones périurbaines et rurales',
      'Demande soutenue en viande de porc dans les marchés urbains (Cotonou, Parakou, Porto-Novo)',
      'Projets publics et privés de modernisation de l’élevage (MAEP, PNUD, IFAD, Enabel…)',
      'Opportunités d’auto-emploi élevées, même avec des moyens modestes',
      'Intégration possible dans les circuits courts et les marchés locaux organisés',
    ],
  },
  'DTM-LTA-HORTICULTURE': {
    catalogue: 'LTA',
    pages: [9, 10],
    description:
      'Le métier de production horticole consiste à cultiver des légumes, des fleurs ou des plantes ornementales. Le technicien de ce métier maîtrise les techniques modernes de production maraîchère et d’horticulture ornementale, de la préparation du sol à la commercialisation. Il est un technicien complet, capable de réaliser les diagnostics d’une exploitation agricole afin d’apporter des solutions pertinentes innovantes et respectueuses de l’environnement.',
    competences: [
      {
        titre: 'Maraîchage',
        elements: [
          'Maîtrise des techniques de réalisation de l’étude du marché et de l’impact environnemental',
          'Connaissance des normes d’implantation d’une exploitation agricole',
          'Compétence en aménagement d’un site horticole',
          'Maîtrise des itinéraires techniques de production des cultures maraichères sur terre, en culture sous serre et hors-sol',
          'Maîtrise la mécanisation agricole (irrigation et l’utilisation des engins agricoles)',
          'Préparation des sols, semis et repiquage, irrigation et fertilisation, protection phytosanitaire, culture sous serre et hors-sol, récolte, conditionnement, mécanisation agricole et transformation primaire',
        ],
      },
      {
        titre: 'Horticulture ornementale',
        elements: [
          'Connaissance des techniques de production de fleurs coupées et plantes en pots',
          "Maîtrise la création et entretien d'espaces verts",
          'Compétence en aménagement paysager, multiplication des plantes ornementales, art floral et gestion de pépinières ornementales',
        ],
      },
      {
        titre: 'Gestion',
        elements: [
          "Connaissance des méthodes de gestion d’une exploitation horticole, de la commercialisation et gestion d'équipes",
        ],
      },
    ],
    debouches: [
      {
        titre: 'Emploi salarié',
        elements: [
          'Chef de culture maraîchère',
          'Responsable d’espaces verts (hôtels, résidences, entreprises)',
          'Technicien paysagiste',
          'Jardinier qualifié',
          'Fleuriste professionnel',
          'Conseiller technique agricole',
        ],
      },
      {
        titre: 'Auto-emploi',
        elements: [
          'Exploitation maraîchère',
          'Entreprise d’aménagement paysager',
          'Boutique de fleurs et décoration florale',
          'Production de plantes ornementales',
          'Service d’entretien de jardins',
          'Pépinière ornementale',
          'Production de légumes hors-sol',
        ],
      },
    ],
    secteursActivite: [
      'Maraîchage',
      'Floriculture',
      'Espaces verts, paysagisme',
      'Art floral',
      'Pépinières ornementales',
      'Transformation de légumes',
    ],
    partenariats: [],
    partenariatsIntro:
      'Des partenariats sont noués avec les entreprises publiques (ministères, agences, directions, services, etc.) et privées (cabinets, fermes, ONG etc.) pour l’accompagnement des apprenants en cours de formation à travers les stages',
    profilSortie:
      'Diplôme de Technicien au Métier (DTM) en conduite de productions horticoles : 3 ans ; Diplôme Supérieur de Technicien au Métier (DSTM) : 2 ans après le DTM',
    acces: [
      'Deux voies pour accéder à la formation : le concours pour l’obtention d’une bourse de l’État béninois ; l’inscription à titre payant sur étude de dossiers',
      'Pour le DTM, profil d’entrée : Brevet d’études du premier cycle (BEPC) ou équivalent',
      'Pour le DSTM, profil d’entrée : DTM ou équivalent',
    ],
    remarques: [
      'Profil de sortie éclaté sur les deux colonnes du document : reconstitué.',
      'Débouchés publiés en deux phrases énumératives (emploi salarié, auto-emploi) : présentés en listes.',
    ],
  },
  'DTM-LTA-PISCICULTURE': {
    catalogue: 'LTA',
    pages: [11, 12],
    description:
      'Le détenteur du DTM Pisciculture et Aquaculture est un professionnel qui maîtrise les techniques de production, de conditionnement et de commercialisation des organismes aquatiques (poissons, crustacés, mollusques) en milieu contrôlé. Son métier, à la fois technique, manuel et scientifique, consiste à assurer le cycle complet de production, de la reproduction à la commercialisation, dans le respect de l’environnement et du bien-être animal. Il travaille en plein air, en serre ou en hall, et son activité est rythmée par les saisons et les cycles biologiques des espèces.',
    competences: [
      'Conduite d’élevage des espèces piscicoles et aquacoles (reproduction, alimentation, croissance)',
      'Suivi sanitaire des poissons et identification précoce des anomalies',
      'Gestion de la qualité de l’eau (paramètres physico-chimiques, oxygénation, renouvellement)',
      'Maintenance des installations et équipements piscicoles (bassins, pompes, aérateurs)',
      'Application des règles d’hygiène, de sécurité et de protection environnementale',
      'Mise en œuvre de bonnes pratiques de biosécurité pour prévenir les maladies',
      'Tenue rigoureuse des registres d’élevage (croissance, mortalités, traitements, alimentation)',
      'Planification des cycles de production en fonction des objectifs d’élevage',
      'Récolte, manipulation et conditionnement des poissons dans le respect des normes',
      'Stockage et gestion des aliments, intrants et matériels d’élevage',
      'Commercialisation des produits piscicoles et aquacoles (vente, promotion, relation clients)',
      'Respect des réglementations liées à l’aquaculture et à la protection des ressources',
      'Application des règles d’hygiène, de sécurité et de biosécurité',
      'Respect des réglementations liées à l’environnement, à l’aquaculture et à la protection des ressources aquatiques',
    ],
    debouches: [
      {
        titre: 'Postes directs',
        elements: ['Technicien piscicole/aquacole', "Responsable d'écloserie"],
      },
      {
        titre: 'Évolutions',
        elements: ["Responsable d'exploitation", 'Chef de production'],
      },
      {
        titre: 'Entrepreneuriat',
        elements: [
          "Création et gestion d'une ferme aquacole",
          "Reprise et gestion d'une ferme aquacole",
          'Transformateur / vendeur de produits piscicoles et aquacoles',
          'Fabricant d’aliments piscicoles et aquacoles',
          'Commerçant et distributeur de produits piscicoles et aquacoles',
        ],
      },
    ],
    secteursActivite: [
      'Pisciculture continentale (production, conditionnement et commercialisation) de poissons et autres espèces aquacoles',
      'Écloseries (production d’alevins)',
      "Aquaculture d'ornement (aquariophilie)",
      'Projets et ONG intervenant dans la pisciculture et l’aquaculture',
      'Marchés et circuits de distribution de produits de produits piscicoles et aquacoles',
    ],
    partenariats: [
      "Partenariat avec les structures privées et publiques (ATDA, DDAEP, Projets et Programmes, Direction des Pêches ; les Universités ; INRAB ; l’Interprofession Poisson d'Élevage du Bénin (IPEB) ….)",
      'PTF (JICA...)',
    ],
    profilSortie: 'Diplôme de Technicien au Métier de pisciculture et aquaculture',
    acces: [
      'Le concours : de 14 à 20 ans, titulaire du BEPC, du CAP ou d’un diplôme équivalent',
      'L’inscription à titre payant sur étude de dossiers',
      'Pour le DTM : Brevet d’études du premier cycle (BEPC) ou équivalent',
      'Pour le DSTM : DTM ou équivalent',
    ],
    remarques: ['Coquilles du document corrigées (« Rresponsable », « commercialization », parenthèse non refermée).'],
  },
  'DTM-LTA-CEREALES': {
    catalogue: 'LTA',
    pages: [13, 14],
    description:
      'Le producteur de céréales et légumineuses est un technicien spécialisé dans la conduite des principales cultures vivrières (maïs, riz, mil, sorgho, soja, niébé, arachide…). Il maîtrise la gestion agronomique, l’organisation de la production et les techniques de conservation post-récolte, et contribue à la modernisation des exploitations, qu’elles soient intensives, semi-intensives ou extensives. Le métier exige une présence quotidienne en raison du suivi permanent des opérations culturales. Les principaux débouchés incluent : technicien de production, conseiller agricole, responsable technique d’exploitation, technicien de projet, animateur de coopérative, auto-entrepreneur agricole ou assistant dans des programmes de recherche.',
    competences: [
      'Conduite des cultures vivrières (maïs, riz, mil, sorgho, soja, niébé, arachide…)',
      'Préparation et gestion des sols (labour, amendements, fertilisation)',
      'Mise en place des semis et maîtrise des itinéraires techniques adaptés à chaque culture',
      'Gestion de l’irrigation et de l’humidité des sols selon les besoins culturaux',
      'Surveillance phytosanitaire et application raisonnée des traitements',
      'Utilisation et entretien du matériel agricole (outils manuels, motoculteurs, pulvérisateurs…)',
      'Organisation des travaux agricoles selon les saisons et les cycles de production',
      'Suivi de la croissance des cultures et identification précoce des anomalies',
      'Récolte, tri et manipulation des produits dans le respect des normes de qualité',
      'Techniques de conservation post-récolte (séchage, stockage, protection contre ravageurs)',
      'Tenue des registres d’exploitation (rendements, intrants, interventions, calendrier)',
      'Application des règles de sécurité, d’hygiène, et de protection environnementale en agriculture',
    ],
    debouches: [
      'Producteur de Céréales et Légumineuses en exploitation personnelle, familiale ou coopérative',
      'Chef d’exploitation agricole',
      'Salarié agricole dans une ferme de production semencière',
      'Technicien ou conseiller agricole dans les structures (MAEP, ATDA, ONG, coopératives, etc.)',
      'Responsable de production dans une exploitation agroalimentaire',
      'Transformateur / vendeur de produits fermiers',
      'Commerçant et distributeurs de produits céréaliers et légumineuses',
    ],
    secteursActivite: [
      'Exploitations agricoles vivrières et commerciales',
      'Coopératives et unions de producteurs',
      'Projets de développement agricole et de sécurité alimentaire',
      'Organisations paysannes et ONG rurales',
      'Entreprises de collecte, transformation ou commercialisation',
      'Structures de vulgarisation agricole (DDAEP, ATDA, etc.)',
      'Initiatives d’agriculture contractuelle ou agroécologique',
      'Zones de développement agricole intensif (ZDAI)',
      'Marchés urbains et circuits de distribution de produit',
    ],
    partenariats: [
      'Partenariat avec les structures privées et publiques (ATDA, DDAEP, INRAB, Centre de recherche d’Ina etc.)',
      'Partenariat avec les fermes privées et publiques (Fermes semencières, Ferme KDK etc.)',
    ],
    profilSortie:
      'Diplôme de Technicien au Métier (DTM) en production céréalière et légumineuse ; Certificat de spécialisation aux métiers (CSM)',
    acces: [
      'Le concours : de 14 à 20 ans, titulaire du BEPC, du CAP ou d’un diplôme équivalent',
      'L’inscription à titre payant sur étude de dossiers',
      'Diplôme de Technicien au Métier (DTM) : être titulaire du BEPC ou équivalent',
      'Formation certifiante de spécialisation aux métiers (FCSM) : avoir fait l’éducation de base',
      'Formation à distance : avoir un prérequis ou une formation de base dans la spécialité de son choix ; durée de formation : 2 ans au moins',
    ],
    remarques: ['Coquilles du document corrigées (« Rresponsable », « commercialization », parenthèse non refermée).'],
  },
  'DTM-LTA-RACINES-TUBERCULES': {
    catalogue: 'LTA',
    pages: [15, 16],
    description:
      'Le technicien en production de racines et tubercules est un professionnel formé pour conduire et gérer des activités de production de cultures telles que le manioc, l’igname, la patate douce, le taro etc. Il intervient dans la préparation du sol, la mise en place du matériel végétal, l’entretien, la récolte, la conservation et la transformation primaire (gari, tapioca, chips, farine, etc.). Son action contribue à la sécurité alimentaire, à la création de valeur ajoutée locale et à la professionnalisation du secteur vivrier.',
    competences: [
      'Préparer et installer une parcelle de culture de racines et tubercules',
      'Conduire et entretenir les cultures une parcelle de racines et tubercules',
      'Récolter, conditionner et transformer les racines et tubercules',
      'Gérer techniquement et économiquement une exploitation de production de racines et tubercules',
      'Encadrer et coacher les producteurs et transformateurs de racines et tubercules',
    ],
    debouches: [
      'Exploitant agricole spécialisé en racines et tubercules',
      'Producteur de manioc, igname, taro, patate douce ou autres tubercules',
      'Ouvrier qualifié dans une exploitation de cultures racinaires',
      'Chef d’équipe ou responsable de parcelle agricole',
      'Animateur agricole dans des organisations paysannes',
      'Technicien agricole dans des projets ou programmes de développement rural',
      'Conseiller agricole spécialisé en cultures racinaires et tuberculeuses',
      'Entrepreneur agricole dans la production ou la transformation (gari, tapioca, attiéké, chips, farine…)',
      'Agro-transformateur de produits dérivés de racines et tubercules',
      'Fournisseur de matériel végétal (semences améliorées, boutures, plants)',
      'Gestionnaire de centre de collecte, tri ou conditionnement de produits agricoles',
      'Assistant technique dans des structures de recherche, d’expérimentation ou de vulgarisation agricole',
    ],
    secteursActivite: [
      'Exploitations agricoles spécialisées en cultures vivrières',
      'Coopératives et groupements de producteurs',
      'Unités de transformation agroalimentaire',
      'Projets et ONG d’appui au développement rural',
      'Entrepreneuriat agricole individuel ou collectif',
    ],
    partenariats: [
      'Des exploitations agricoles partenaires pour les stages et travaux pratiques',
      'Des unités de transformation de manioc et d’igname de la région',
      'Des ONG et projets de développement agricole (GIZ, Helvetas, LuxDev, Care Benin/Togo, etc.)',
      'Des services de vulgarisation et de conseil agricole du ministère en charge de l’agriculture',
    ],
    profilSortie: 'Diplôme de Technicien au Métier (DTM) en production de racines et tubercules',
    acces: [
      'Concours ouverts aux titulaires du BEPC ou BEAT ou diplôme équivalent ; âge limite : 14 ans au moins et 20 ans au plus',
      'Inscriptions à titre payant ouvertes aux titulaires du BEPC ou BEAT ou diplôme équivalent ; âge limite : 15 ans au moins et 25 ans au plus',
      'Diplôme de Technicien au Métier (DTM) : être titulaire du BEPC ou équivalent',
      'Diplôme Supérieur de Technicien au Métier (DSTM) : avoir le DTM',
    ],
    remarques: ['Profil de sortie éclaté sur les deux colonnes du document : reconstitué.'],
  },
  'DTM-LTA-FIBRES': {
    catalogue: 'LTA',
    pages: [17, 18],
    description:
      'Le métier de production de plantes à fibres et textiles consiste à cultiver, entretenir et récolter des espèces végétales destinées à la fabrication de fibres naturelles telles que le coton, le jute, le sisal, le raphia ou encore le kenaf. Le technicien maîtrise les itinéraires techniques de production, la gestion des sols, la protection phytosanitaire et les techniques de récolte et de post-récolte adaptées à chaque plante fibreuse. Il contribue aussi à la qualité du produit final en assurant un traitement soigné des fibres et en respectant les normes de production durable.',
    competences: [
      'Maîtrise de l’itinéraire technique de production du cotonnier',
      'Gestion des ravageurs et maladies du cotonnier',
      'Maitrise la qualité des différents intrants',
      'Maîtrise les différentes qualités de fibres de coton',
      'Maîtrise la conduite des engins de filature',
    ],
    debouches: [
      'Technicien de production des plantes à fibres et textiles',
      'Responsable technique d’exploitation',
      'Assistant dans des programmes de recherche ou d’expérimentation',
      'Conseiller ou agent d’encadrement agricole',
      'Animateur de coopérative ou d’union de producteurs',
      'Auto-entrepreneur agricole spécialisé',
    ],
    secteursActivite: [
      'Exploitations agricoles',
      'Coopératives et unions de producteurs',
      'Projets de développement agricole',
      'Organisations paysannes et ONG rurales',
      'Structures de vulgarisation agricole (ATDA, DDAEP, etc.)',
      'Zones de développement agricole intensif (GDIZ)',
    ],
    partenariats: [
      'Structures de vulgarisation agricole (ATDA, DDAEP etc.)',
      'Structures de recherche (INRAB ; IRC) ou de certification',
      'Industries textiles',
    ],
    partenariatsIntro: 'Entreprises et structures du secteur offrant des opportunités d’insertion : AIC, SODECO, GDIZ',
    profilSortie: 'Diplôme de Technicien au Métier (DTM) en production de plantes à fibres et textiles',
    acces: [
      'Concours ouverts aux titulaires du BEPC ou BEAT ou diplôme équivalent ; âge limite : 14 ans au moins et 20 ans au plus',
      'Inscription à titre payant, pour le titulaire du BEPC : avoir obtenu une moyenne annuelle d’au moins dix sur vingt en mathématiques et dix sur vingt en sciences de la vie et de la Terre (SVT)',
      'Inscription à titre payant, pour le titulaire du BEAT : avoir obtenu une moyenne annuelle d’au moins dix sur vingt en mathématiques et dix sur vingt en agriculture spéciale',
      'Passer favorablement le test psychotechnique',
      'Diplôme de Technicien au Métier (DTM) : être titulaire du BEPC ou équivalent',
    ],
    remarques: [
      'Cinq débouchés sans rapport avec les plantes à fibres (plantations fruitières, fruits transformés, restauration des paysages…), manifestement copiés d’une autre fiche : non repris.',
      'Deux éléments de la rubrique « partenariat » décrivent des perspectives (auto-emploi, intégration en coopérative) : repris comme telles.',
      'Profil de sortie éclaté sur les deux colonnes du document : reconstitué.',
    ],
    perspectives: [
      'Forte capacité d’auto-emploi, notamment dans les zones à fort potentiel agricole (ATDA 2)',
      'Intégration facile dans les groupements de producteurs ou coopératives',
    ],
  },
  'DTM-LTA-ARBORICULTURE': {
    catalogue: 'LTA',
    pages: [19, 20],
    description:
      'Le technicien en production fruitière et forestière est un professionnel de l’agriculture spécialisé dans la production des fruits et produits forestiers. Son activité consiste à produire, gérer, transformer et valoriser les espèces fruitières, assurer la gestion durable des ressources forestières naturelles ou aménagées, contribuer à la reforestation, à l’agroforesterie, à la conservation, et à la promotion des chaînes de valeur agricoles et forestières. Il peut travailler dans des exploitations de tailles variables promouvant les chaînes de valeur agricoles et forestières.',
    competences: [
      'Gérer une exploitation de production fruitière et forestière (planification, budget, logistique)',
      'Organiser les travaux de plantation, d’entretien, de taille, de récolte et de stockage',
      'Utiliser le matériel agricole et l’outils numériques de suivi',
      'Assurer la vente des produits de l’exploitation',
    ],
    debouches: [
      'Technicien en production fruitière ou forestière',
      'Responsable de pépinière fruitière/forestière',
      'Animateur agricole ou forestier',
      'Technicien de terrain dans les projets de reboisement',
      'Responsable technique dans une coopérative ou une PME agroécologique',
      'Technicien de collecte, conditionnement ou transformation de fruits',
      'Auto-entrepreneur en production ou en appui-conseil',
    ],
    secteursActivite: [
      'Exploitations agricoles',
      'Coopératives et unions de producteurs',
      'Projets de développement agricole',
      'Organisations paysannes et ONG rurales',
      'Structures de vulgarisation agricole (ATDA, DDAEP, etc.)',
      'Zones de développement agricole intensif (GDIZ)',
    ],
    partenariats: [
      'Partenariat avec les structures privées et publiques (ATDA, DDAEP, DEDRAS ONG, etc.)',
      'Fermes d’Etats et exploitations privées (terre verte de Natitingou, DERA ONG, Helvetas)',
    ],
    profilSortie: 'Diplôme de Technicien au Métier (DTM) en arboriculture fruitière, forestière et produits non ligneux',
    acces: [
      'Le concours : de 14 à 20 ans, titulaire du BEPC, du CAP ou d’un diplôme équivalent',
      'L’inscription à titre payant sur étude de dossiers',
      'Diplôme de Technicien au Métier (DTM) : être titulaire du BEPC ou équivalent',
      'Diplôme Supérieur de Technicien au Métier (DSTM) : avoir le DTM',
    ],
    remarques: ['Les sept débouchés sont imprimés deux fois de suite dans le document : doublons retirés.'],
  },
  'DTM-LTA-PALMIER-COCOTIER': {
    catalogue: 'LTA',
    pages: [21, 22],
    description:
      'Le titulaire du DTM « Production de plantes oléagineuses » cultive, récolte, assure la gestion des plantations de palmiers à huile, de cocotiers et de karité ainsi que la transformation primaire des fruits. Il implémente les améliorations culturales et la diversification des produits (huiles, coprah, fibres et autres produits dérivés). Ce métier doit s’exercer dans le respect des règles d’hygiène, de sécurité et de protection de l’environnement.',
    competences: [
      'Assurer la production c’est-à-dire, observer les stades phénologiques, réaliser la pollinisation assistée, récolter les régimes/noix, trier et stocker',
      'Réaliser la protection phytosanitaire à savoir identifier les ravageurs et maladies, appliquer les traitements et assurer le suivi sanitaire',
      'Transformer et valoriser c’est-à-dire participer à l’extraction de l’huile de palme/coco/karité, au séchage du coprah, à la valorisation des sous-produits',
      'Tenir les registres d’exploitation consistant à remplir les documents de gestion, calculer les rendements, planifier les activités et encadrer la main-d’œuvre',
    ],
    debouches: [
      {
        titre: 'Emplois possibles dans le secteur public et privé',
        elements: [
          'Technicien de plantation dans les sociétés agro-industrielles',
          'Chef de parcelle ou chef de bloc dans une grande plantation',
          'Agent de vulgarisation dans les structures d’appui agricole (MAEP, projets, ONG)',
          'Technicien de production dans les coopératives de producteurs ou unités villageoises',
          'Encadreur de pépinière pour le palmier à huile ou le cocotier',
          'Agent de contrôle qualité dans les huileries ou unités de transformation',
        ],
      },
      {
        titre: 'Emplois dans la transformation et la valorisation',
        elements: [
          'Opérateur ou gestionnaire d’unité artisanale d’extraction d’huile de palme ou de coprah',
          'Technicien de production dans les entreprises de transformation (savonneries, huileries, agro-industries)',
          'Responsable qualité des produits oléagineux',
          'Agent de valorisation des sous-produits (rafles, fibres, tourteaux, biodiesel, charbon de coques)',
        ],
      },
      {
        titre: 'Possibilités d’auto-emploi et d’entrepreneuriat',
        elements: [
          'Plantation familiale ou commerciale de palmier à huile ou de cocotier',
          'Unité artisanale d’extraction d’huile ou de production de savon',
          'Atelier de germination et de vente de plants améliorés',
          'Service de prestation agricole (plantation, entretien, récolte, pollinisation, transport)',
        ],
      },
      {
        titre: 'Domaines connexes accessibles',
        elements: [
          'L’encadrement de groupements de producteurs',
          'La conduite d’expérimentations agronomiques',
          'Les programmes de reboisement et de développement rural',
          'La formation pratique dans les écoles ou centres agricoles',
        ],
      },
    ],
    secteursActivite: [
      'Entreprises agro-industrielles de production de plantes oléagineuses',
      'Coopératives; ONG',
      'Exploitations privées',
      'Unités de transformations des fruits (noix de palme, cocos, noix de karité)',
      'Projets de développement agricole',
    ],
    partenariats: [
      'Partenariat avec les promoteurs de plantations de plantes oléagineuses',
      'Partenariat avec les structures étatiques d’encadrement des aviculteurs (ATDA, DDAEP, CRAPP)',
      'Partenariat avec les organisations professionnelles CAR et UCAR…',
    ],
    profilSortie: 'Diplôme de Technicien au Métier (DTM) en production de plantes oléagineuses',
    acces: [
      'Le concours : de 14 à 20 ans, titulaire du BEPC, du BEAT ou d’un diplôme équivalent',
      'L’inscription à titre payant sur étude de dossiers : de 15 à 25 ans',
      'Diplôme de Technicien au Métier (DTM) : la voie du concours donnant droit à une bourse de l’État et la voie des inscriptions à titre payant (ITP) après une sélection sur la base d’un dossier d’inscription',
    ],
    remarques: [
      'Débouchés publiés sous quatre intertitres introduits chacun par une phrase (« Le diplômé peut exercer comme : »…) : intertitres conservés, phrases d’introduction omises.',
    ],
  },
};
