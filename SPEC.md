# SPEC.md — Cahier des charges

## Mon Orientation — Plateforme nationale d'orientation scolaire

| Champ | Valeur |
|---|---|
| **Client** | Ministère de l'Enseignement Secondaire, Technique et de la Formation Professionnelle (MESTFP) — République du Bénin |
| **Nom du projet** | Mon Orientation |
| **Statut** | Document de travail (à valider) |
| **Date** | 11 septembre 2026 |
| **Référence** | Note de cadrage du 08/09/2026 |

---

## 1. Contexte et justification

L'orientation est le dispositif par lequel le système éducatif dirige les flux d'apprenants vers les formations qui correspondent à leurs aptitudes et aux besoins du pays. Elle relève strictement du système éducatif et ne saurait être associée à des acteurs ou activités politiques.

Aujourd'hui, l'orientation reste dominée par un réflexe unique « tout le monde à l'université » alors que les débouchés réels, les taux d'insertion et les priorités de l'État appellent une répartition plus large vers les filières techniques, professionnelles et les écoles de métiers. La plateforme vise à outiller ce rééquilibrage par l'information et l'aide à la décision, dès le début du secondaire.

Le pays dispose déjà d'EducMaster, le Système d'Information et de Gestion de l'Éducation (SIGE) national, qui couvre la maternelle au secondaire et centralise le suivi des apprenants, des enseignants, des établissements, ainsi que les notes et résultats scolaires. La plateforme d'orientation ne se construit donc pas ex nihilo : elle s'adosse à cet existant plutôt que de le recréer.

---

## 2. Objectifs

1. **Accompagner chaque apprenant** dans une décision d'orientation éclairée, du premier cycle du secondaire jusqu'à l'entrée dans le supérieur ou la vie active.
2. **Rendre visible l'intégralité de l'offre de formation** (générale, technique, technique agricole, professionnelle, écoles de métiers, universités et spécialités) et les débouchés associés.
3. **Fonder l'orientation sur des données objectives** : parcours et notes de l'élève, croisés avec ses préférences.
4. **Offrir un accompagnement personnalisé et dialogué** grâce à un conseiller pédagogique intelligent adossé aux données de la plateforme.
5. **Lever les barrières de la langue et de l'écrit** : rendre l'information accessible à l'oral et en langues nationales, y compris pour les parents non lettrés.
6. **Fournir au niveau central les indicateurs de pilotage** (flux, quotas, répartition par filière et par département).
7. **Préparer progressivement les mentalités**, de sorte que le dispositif soit pleinement opérationnel le jour où l'ensemble des lycées et écoles de métiers seront ouverts.

---

## 3. Périmètre et principes directeurs

### 3.1 Périmètre de niveaux

De la classe de **4e** à la **terminale**, avec un enchaînement information → collecte → aide à la décision qui s'affine à chaque palier.

### 3.2 Principes retenus

- **Appui sur l'existant** : EducMaster comme socle de données (identité, inscriptions, notes).
- **NIP comme identifiant unique** : clé de rattachement du dossier de l'apprenant tout au long de son parcours, et pivot d'interopérabilité avec les autres administrations.
- **Construction progressive et expérimentale** : montée en charge au rythme de l'ouverture des établissements.
- **Conformité au DSBJ** : utilisation du Design Système du Bénin pour toutes les interfaces (palette officielle, composants `.bj-*`, Montserrat, WCAG 2.1 AA).
- **Hors-ligne partiel** : contenus d'information accessibles hors-ligne ; soumissions et calculs en ligne.

---

## 4. Plateformes cibles

| Plateforme | Technologie | Priorité MVP |
|---|---|---|
| **Application web** | Framework moderne (Next.js ou similaire), responsive | Oui |
| **Application mobile** | ~~Flutter (iOS + Android)~~ — abandonnée (décision du 17/09/2026, voir JOURNAL.md) | Non |
| **PWA** | Complémentaire au web, installable | Souhaitable |

### 4.1 Accessibilité

- Conforme WCAG 2.1 niveau AA
- Navigation clavier complète
- Support lecteurs d'écran
- Mode haute contraste
- Textes adaptables (taille de police)

### 4.2 Multilinguisme

- **Français** : langue principale de l'interface
- **Langues nationales** : accès progressif via le conseiller IA (fongbé, yoruba, bariba, dendi…)
- Le premier déploiement couvrira le français ; les langues nationales seront ajoutées progressivement en lien avec le projet « J'aime ma langue » (ASIN/IIDIA)

---

## 5. Composantes de la plateforme

### 5.1 Catalogue national de l'offre de formation

**Objectif** : Base de connaissance recensant l'ensemble des parcours de formation.

**Contenu pour chaque parcours :**
- Lycées généraux, techniques, techniques agricoles, professionnels
- Écoles de métiers
- Universités et spécialités
- Diplômes délivrés
- Métiers visés et débouchés
- Taux d'insertion
- Conditions d'accès
- Existence ou non de bourses

**Fonctionnalités :**
- Recherche multicritère (filière, localisation, niveau, débouché)
- Fiches descriptives complètes pour chaque parcours
- Filtrage par département, type d'établissement, niveau
- Comparaison de filières
- Accès via le conseiller IA

### 5.2 Module d'information et de communication

**Objectif** : Diffusion de contenus pédagogiques pour guider l'orientation.

**Contenus :**
- Guide numérique d'orientation
- Capsules vidéo explicatives
- Supports par palier (4e, 3e, 1re, Terminale)
- Informations sur les débouchés concrets de chaque filière
- Contenus rassurants pour les parents

**Fonctionnalités :**
- Navigation par palier et par thématique
- Mode hors-ligne pour la consultation des contenus
- Mise à jour centralisée
- Accessibilité multilingue (progressive)

### 5.3 Moteur d'orientation et d'aide à la décision

**Objectif** : Croiser les notes de l'élève (issues d'EducMaster) avec les préférences saisies pour proposer des orientations.

**Fonctionnement en deux temps :**
1. **En 4e** : Tendances et suggestions d'exploration
2. **En 3e** : Recommandations affinées et propositions concrètes

**Fonctionnalités :**
- Algorithme de matching notes + préférences + débouchés
- Produit des propositions, non des décisions imposées
- Explicabilité des recommandations (éléments sur lesquels elles reposent)
- Prise en compte des quotas (lycées techniques)
- Historique des recommandations par palier

### 5.4 Conseiller pédagogique IA

**Objectif** : Assistant conversationnel prolongeant le moteur d'orientation en le rendant dialogué et pédagogique.

**Capacités :**
- Répondre aux questions concrètes (« à quoi mène telle filière ? », « quels débouchés si je choisis ce parcours ? ?)
- Accompagner l'élève dans sa réflexion à chaque palier
- Expliquer les recommandations du moteur
- Accessibilité multilingue et vocale (via « J'aime ma langue »)

**Principes et garde-fous :**
- Le conseiller IA assiste et éclaire ; il ne se substitue ni au conseiller humain, ni à la décision de l'élève et de sa famille
- Ses recommandations sont explicables : il indique les éléments sur lesquels elles reposent (notes, préférences, débouchés)
- Il s'appuie exclusivement sur les données et le catalogue officiels
- Supervision humaine et contrôle qualité prévus
- Protection des données de l'apprenant

### 5.5 Espace apprenant / parent

**Objectif** : Interface personnelle rattachée au NIP.

**Fonctionnalités :**
- Consultation du catalogue de formations
- Questionnaire de découverte (goûts, ambitions, qualités, contraintes) — une fois, modifiable ensuite
- Saisie des vœux et préférences : en 3e, réalignée sur la fiche unique d'inscription MESRS/DESTFP (2 choix de spécialité classés + 1 établissement qui les dispense tous deux) ; en Terminale, 3 choix libres pour l'admission au supérieur
- Suivi de la proposition d'orientation
- Accès aux contenus d'information
- Tableau de bord personnalisé (parcours, notes, recommandations)
- Gestion du profil

**Accès :**
- Apprenant : son propre dossier
- Parent : dossiers de ses enfants (liens familial vérifiés)

### 5.6 Intégration EducMaster & NIP (socle de données)

**Objectif** : Connexion au SIGE pour récupérer identité, inscriptions et notes sans ressaisie.

**Fonctionnalités :**
- Authentification et récupération des données via API EducMaster
- NIP comme clé unique d'identification
- Synchronisation périodique des données (notes, inscriptions)
- Gestion des conflits et des erreurs de connexion
- Traçabilité des échanges de données

**Données échangées :**
- Identité de l'apprenant (NIP, nom, prénom, date de naissance)
- Inscriptions (établissement, classe, année)
- Notes et résultats (par matière, par trimestre/semestre)
- Historique du parcours

### 5.7 Module de pilotage et statistiques

**Objectif** : Tableaux de bord pour le niveau central.

**Indicateurs :**
- Suivi des flux par filière et par département
- Gestion des quotas (notamment lycées techniques)
- Taux d'orientation par type de formation
- Répartition géographique des choix
- Tendances d'évolution d'une année sur l'autre

**Fonctionnalités :**
- Tableaux de bord interactifs
- Export de rapports (PDF, Excel)
- Cartographie nationale et départementale
- Filtres par période, établissement, département
- Accès sécurisé par rôle (DGES, niveau central)

### 5.8 Gestion des séances d'information et de l'accompagnement

**Objectif** : Organisation et suivi des séances menées auprès des établissements.

**Fonctionnalités :**
- Planification des séances (4e, 3e, Terminale)
- Suivi des équipes d'intervention
- Association des contenus numériques aux séances
- Suivi de participation des établissements
- Rapports de synthèse

---

## 6. Fonctionnalités transversales

### 6.1 Gestion des identités et des droits

- Profils et habilitations par rôle :
  - **Apprenant** : accès à son dossier, catalogue, conseiller IA
  - **Parent** : accès aux dossiers de ses enfants
  - **Établissement** : suivi de ses élèves, saisie de notes (si applicable)
  - **DGES** : pilotage et statistiques
  - **Niveau central** : administration et configuration
- Authentification sécurisée (NIP + mot de passe / SMS)
- À terme : intégration Mobile ID Bénin (PKI)

### 6.2 Interopérabilité par le NIP

- Échange sécurisé avec EducMaster
- À terme : interopérabilité avec les autres administrations
- API documentées et versionnées

### 6.3 Restitution par département

- Toutes les données consultables et cartographiables à l'échelle nationale et départementale
- Tableaux de bord par département avec comparaisons

### 6.4 Traçabilité du parcours

- Historisation des notes, choix et orientations successives
- De la 4e à la terminale
- Export du parcours par l'apprenant

### 6.5 Mode hors-ligne

- Consultation des contenus d'information (catalogue, guides, vidéos mises en cache)
- Consultation du profil et des recommandations précédentes
- Soumission des préférences et interaction avec le conseiller IA : en ligne uniquement

---

## 7. Points à arbitrer (validation client)

Ces points ont été laissés ouverts en séance et doivent être tranchés pour finaliser le cadrage :

| # | Question | Options | Recommandation |
|---|---|---|---|
| 1 | **Séance en classe de première** | Maintenir une étape d'information dès la première, ou aller directement de la 3e à la terminale ? | Maintenir une séance info en 1re (préparer les esprits) |
| 2 | **Saisie des préférences en 3e** | L'élève, le parent, ou les deux ? | Les deux, avec validation parent |
| 3 | **Articulation avec les entreprises** | Cadre de concertation à préciser | À définir avec le client |
| 4 | **Statut d'EducMaster** | Deux missions / plateforme « cédée » ? | Clarifier les conditions d'appui technique |
| 5 | **Périmètre du conseiller IA** | Se limite-t-il à l'information ou formule-t-il des recommandations ? | Information + recommandations explicables, avec supervision humaine |
| 6 | **Langues nationales prioritaires** | Premières langues à couvrir et calendrier | Fongbé en priorité (phase pilote « J'aime ma langue »), puis yoruba, bariba, dendi |

---

## 8. Contraintes techniques

### 8.1 Intégration EducMaster

- API REST existante ou à documenter avec l'équipe EducMaster (Tics Master SARL)
- Authentification par token / clé API
- Synchronisation des données : fréquence à définir (quotidienne ? hebdomadaire ?)
- Gestion des erreurs de connexion et file d'attente

### 8.2 Conseiller IA

- Intégration avec un modèle de langage (LLM)
- Base de connaissances : catalogue de formations + données EducMaster
- Interface conversationnelle (texte + vocal)
- Support multilingue via le projet « J'aime ma langue » (ASIN/IIDIA)
- Stockage sécurisé des échanges (protection des données)

### 8.3 Performance

- Temps de réponse < 3 secondes pour les opérations standard
- Cache des contenus pour le mode hors-ligne
- Optimisation pour les connexions lentes (zones rurales)
- Architecture scalable pour la montée en charge progressive

### 8.4 Sécurité

- Chiffrement des données en transit (TLS) et au repos
- Authentification robuste
- Protection des données personnelles (RGPD-equivalent béninois)
- Audit de sécurité avant mise en production
- Conformité aux normes de sécurité du gouvernement du Bénin

---

## 9. Design et identité visuelle

### 9.1 Conformité DSBJ

La plateforme doit utiliser le **Design Système du Bénin (DSBJ)** comme framework de design principal :

- **Package** : `@flrxnt/dsbj` (NPM) — composants `.bj-*`
- **Palette** : Vert `#008751`, Jaune `#FCD116`, Rouge `#E8112D`, Ocre `#C8842A`, Bleu Horizon `#1B6B93`
- **Typographie** : Montserrat (corps), Spectral (éditorial)
- **Accessibilité** : WCAG 2.1 niveau AA
- **Thème** : Clair par défaut, sombre optionnel (`data-bj-theme="dark"`)

### 9.2 Charte gouvernementale

- Bande tricolore en en-tête (vert, jaune, rouge)
- Marque « République du Bénin »
- Titre du service : « Mon Orientation »
- Sous-titre : « Plateforme nationale d'orientation scolaire »

### 9.3 Composants DSBJ utilisés

- `bj-header` — en-tête avec navigation
- `bj-card` — fiches de formation, actualités
- `bj-tile` — accès rapides aux services
- `bj-btn` — boutons d'action
- `bj-alert` — notifications et messages
- `bj-modal` — dialogues modaux
- `bj-accordion` — sections pliables (détails de filières)
- `bj-table` — données tabulaires (statistiques)
- `bj-form` — formulaires de saisie
- `bj-footer` — pied de page
- `bj-callout` — mises en avant
- `bj-search` — recherche dans le catalogue

---

## 10. Jalons

| Date | Livrable |
|---|---|
| **Fin septembre 2026** | SPEC.md validé, ARCHITECTURE.md et TASKS.md produits |
| **Mi-octobre 2026** | DESIGN.md validé, backend en cours |
| **Fin octobre 2026** | **MVP livré** : catalogue, moteur d'orientation, espace apprenant, intégration EducMaster (basique) |
| **Novembre 2026** | Déploiement pilote dans des établissements test |
| **Décembre 2026** | Conseiller IA (version textuelle), mode hors-ligne |
| **T1 2027** | Conseiller IA multilingue/vocal, statistiques avancées, séances d'information |

---

## 11. Hors-périmètre (V1)

- Inscription des élèves sur la plateforme (données via EducMaster)
- Gestion des examens (rôle d'EducMaster)
- Plateforme de e-learning (rôle de Séwé)
- Processus de recrutement des enseignants
- Gestion financière des établissements
