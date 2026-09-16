# ARCHITECTURE.md — Architecture technique

## Mon Orientation — Plateforme nationale d'orientation scolaire

| Champ | Valeur |
|---|---|
| **Date** | 11 septembre 2026 |
| **Référence** | SPEC.md v1 |
| **Statut** | Document de travail (à valider) |

---

## 1. Vision d'ensemble

La plateforme Mon Orientation est un système composé de trois couches principales :

```
┌─────────────────────────────────────────────────────┐
│                   PRÉSENTATION                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Web App    │  │ Mobile App   │  │  Admin    │ │
│  │  (Next.js)   │  │  (Flutter)   │  │  (Next.js)│ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                 │                │        │
├─────────┼─────────────────┼────────────────┼────────┤
│         │     API GATEWAY / REST API       │        │
│  ┌──────┴─────────────────┴────────────────┴─────┐  │
│  │              BACKEND (NestJS)                  │  │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────────┐  │  │
│  │  │  Auth   │ │ Orientation│ │  Conseiller   │  │  │
│  │  │  NIP    │ │  Engine   │ │     IA        │  │  │
│  │  └─────────┘ └──────────┘ └───────────────┘  │  │
│  └──────────────────┬────────────────────────────┘  │
│                     │                               │
├─────────────────────┼───────────────────────────────┤
│               DONNÉES                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │PostgreSQL│ │  Redis   │ │ EducMaster API   │    │
│  │(principal)│ │ (cache)  │ │ (SIGE externe)   │    │
│  └──────────┘ └──────────┘ └──────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## 2. Stack technique

### 2.1 Frontend Web

| Technologie | Choix | Justification |
|---|---|---|
| **Framework** | Next.js 14+ (App Router) | SSR/SSG, SEO, performance, écosystème React |
| **UI Library** | DSBJ (`@flrxnt/dsbj`) + React | Conformité charte gouvernementale, 44+ composants |
| **State management** | Zustand | Léger, performant, TypeScript-friendly |
| **Styling** | Tailwind CSS + DSBJ | Utilitaires + composants officiels |
| **Formulaires** | React Hook Form + Zod | Validation typée, performant |
| **i18n** | next-intl | Multilinguisme (français + langues nationales) |
| **API client** | Axios + React Query (TanStack Query) | Cache, retry, synchronisation |
| **PWA** | next-pwa | Mode hors-ligne pour contenus |

### 2.2 Application Mobile

| Technologie | Choix | Justification |
|---|---|---|
| **Framework** | Flutter 3.x (Dart) | Cross-platform (iOS/Android), performant |
| **State management** | Riverpod | Moderne, testable, scalable |
| **Navigation** | GoRouter | Routes déclaratives, deep links |
| **HTTP** | Dio + Retrofit | API typée, intercepteurs |
| **Local storage** | Hive + SQLite | Hors-ligne (contenus mis en cache) |
| **UI** | Material 3 + composants custom | Conformité visuelle DSBJ |
| **IA vocale** | speech_to_text + flutter_tts | Conseiller IA vocal |
| **Connectivité** | connectivity_plus | Détection réseau, mode hors-ligne |

### 2.3 Backend

| Technologie | Choix | Justification |
|---|---|---|
| **Framework** | NestJS (Node.js/TypeScript) | Modulaire, TypeScript, pattern Angular-like |
| **API** | REST (OpenAPI/Swagger) | Standard, documentation auto, interopérabilité |
| **ORM** | Prisma | Type-safe, migrations, introspection |
| **Base de données** | PostgreSQL 16 | Robuste, performant, géospatial (pg_extension) |
| **Cache** | Redis | Sessions, cache des données EducMaster |
| **Auth** | JWT + NIP | Authentification par NIP, tokens JWT |
| **Validation** | class-validator + Zod | Validation DTO |
| **File d'attente** | BullMQ (Redis) | Jobs asynchrones (sync EducMaster, notifications) |
| **Logs** | Pino | Structuré, performant |

### 2.4 Intelligence Artificielle

| Technologie | Choix | Justification |
|---|---|---|
| **LLM** | Gemini (`gemini-3.6-flash`, secours `gemini-3.5-flash-lite`, API Google, SDK `@google/genai`) — prototype sur l'offre gratuite, données de démonstration uniquement ; offre payante ou modèle hébergé au Bénin pour la production | Appel de fonctions, français, sans coût pour le prototype |
| **Orchestration** | Appel d'outils natif du SDK, boucle bornée côté NestJS (pas de LangChain) | Chaque réponse s'appuie sur nos services : traçable et auditable |
| **Embeddings** | Reportés : inutiles pour 67 filières interrogées par outils | À prévoir avec le guide numérique (documents longs) |
| **Vector store** | pgvector (PostgreSQL), reporté | Recherche documentaire dans le guide numérique |
| **Langues nationales (texte)** | Gemini : le conseiller répond en fongbé (paramètre `langue`) | Qualité jugée correcte sur un premier échantillon ; à faire relire plus largement |
| **Vocal** | À choisir. « J'aime ma langue » (ASIN/IIDIA) collecte des voix pour entraîner des modèles mais n'offre pas d'API publique (vérifié le 14/09/2026) : partenariat à demander. En attendant : Meta MMS (`mms-tts-fon`, `mms-1b-all`, fon inclus, licence CC-BY-NC 4.0 non commerciale) | STT/TTS en langues nationales |
| **RAG** | Outils sur le catalogue, le dossier pseudonymisé et le moteur d'orientation | Réponses personnalisées sans donner au modèle le nom ni le NIP de l'élève |

### 2.5 Infrastructure

| Technologie | Choix | Justification |
|---|---|---|
| **Conteneurs** | Docker + Docker Compose | Développement local, reproductibilité |
| **Orchestration** | Docker Swarm ou Kubernetes (prod) | Selon infra gouvernementale |
| **CI/CD** | GitHub Actions | Automatisation des tests et déploiements |
| **Monitoring** | Prometheus + Grafana | Métriques, alertes |
| **Reverse proxy** | Nginx | SSL, load balancing, cache statique |
| **Stockage fichiers** | MinIO ou S3-compatible | Vidéos, documents, supports pédagogiques |

---

## 3. Architecture des données

### 3.1 Modèle principal (entités clés)

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Apprenant  │────<│  NoteMatiere     │     │  Etablissement  │
│  (NIP)      │     │  (par trimestre) │     │  (EducMaster)   │
└──────┬──────┘     └──────────────────┘     └────────┬────────┘
       │                                              │
       │  ┌──────────────────┐                        │
       ├─<│  Preference      │                        │
       │  │  (choix filieres)│                        │
       │  └──────────────────┘                        │
       │                                              │
       │  ┌──────────────────┐     ┌────────────────┐ │
       ├─<│  Recommandation  │────>│  Filiere       │<┘
       │  │  (moteur orien.) │     │  (catalogue)   │
       │  └──────────────────┘     └────────────────┘
       │
       │  ┌──────────────────┐
       └─<│  ConversationIA  │
          │  (historique)     │
          └──────────────────┘

┌─────────────────┐     ┌──────────────────┐
│  Utilisateur    │────<│  Session         │
│  (profil, role) │     │  (JWT)           │
└─────────────────┘     └──────────────────┘
```

### 3.2 Tables principales

**`apprenants`** — synchronisé depuis EducMaster
- `nip` (PK, VARCHAR) — identifiant unique national
- `nom`, `prenom` (VARCHAR)
- `date_naissance` (DATE)
- `sexe` (ENUM: M, F)
- `departement` (VARCHAR)
- `commune` (VARCHAR)
- `derniere_sync` (TIMESTAMP)

**`etablissements`** — supérieur : guide officiel du MESRS (66 établissements) ; secondaire : synchronisation EducMaster prévue
- `id` (PK, UUID)
- `educmaster_id` (VARCHAR, FK externe)
- `code` (VARCHAR, unique) — identifiant stable du référentiel, ex. « UAC-FSS »
- `nom`, `sigle`, `universite` (VARCHAR)
- `type` (ENUM: lycee_general, lycee_technique, lycee_pro, ecole_metier, universite)
- `departement` (VARCHAR, nullable)
- `commune` (VARCHAR, nullable)
- `capacite` (INTEGER)

**`filiere`** — catalogue national de l'offre de formation
- `id` (PK, UUID)
- `nom` (VARCHAR)
- `type` (ENUM: generale, technique, technique_agricole, professionnelle, ecole_metier, universite)
- `description` (TEXT)
- `diplomes_delivres` (JSONB)
- `metiers_vises` (JSONB)
- `debouches` (TEXT)
- `taux_insertion` (DECIMAL)
- `conditions_acces` (TEXT)
- `bourses` (BOOLEAN)
- `domaines` (TEXT[]) — secteurs d'activité, filtre du catalogue (liste dans `backend/src/filiere/domaines.ts`)
- `quota_bourses`, `quota_aides` (INTEGER), `mode_entree`, `series_recommandees`, `matieres_classement` (TEXT), `matieres_cles` (JSONB) — admission au supérieur d'après le guide officiel du MESRS ; `matieres_cles` sert au moteur d'orientation
- `etablissement_id` (FK, nullable)

**`favoris`** — formations mises de côté par l'élève dans le catalogue, proposées en premier lors des vœux
- `apprenant_nip` (FK), `filiere_id` (FK) — clé primaire composée ; suppression en cascade
- `created_at` (TIMESTAMP)

La recherche du catalogue utilise l'extension PostgreSQL `unaccent` (insensible aux accents), créée par une migration.

**`notes`** — notes des apprenants (sync EducMaster)
- `id` (PK, UUID)
- `apprenant_nip` (FK)
- `matiere` (VARCHAR)
- `note` (DECIMAL)
- `bareme` (INTEGER, défaut 20)
- `trimestre` (INTEGER: 1, 2, 3)
- `annee_scolaire` (VARCHAR)
- `derniere_sync` (TIMESTAMP)

**`preferences`** — choix des apprenants
- `id` (PK, UUID)
- `apprenant_nip` (FK)
- `palier` (ENUM: quatrieme, troisieme, premiere, terminale)
- `filiere_id_1`, `filiere_id_2`, `filiere_id_3` (FK, nullable)
- `motivation` (TEXT, nullable)
- `date_saisie` (TIMESTAMP)
- `valide_parent` (BOOLEAN, défaut false)

**`recommandations`** — sorties du moteur d'orientation
- `id` (PK, UUID)
- `apprenant_nip` (FK)
- `palier` (ENUM)
- `filiere_id` (FK)
- `score` (DECIMAL) — score de correspondance
- `explication` (TEXT) — raisons de la recommandation
- `date_generation` (TIMESTAMP)
- `active` (BOOLEAN, défaut true)

**`conversations_ia`** — historique des échanges avec le conseiller
- `id` (PK, UUID)
- `apprenant_nip` (FK)
- `messages` (JSONB) — [{role, content, timestamp}]
- `langue` (VARCHAR)
- `palier` (ENUM)
- `date_debut` (TIMESTAMP)
- `date_fin` (TIMESTAMP, nullable)

**`utilisateurs`** — comptes d'accès
- `id` (PK, UUID)
- `nip` (VARCHAR, nullable) — pour apprenants
- `email` (VARCHAR, nullable)
- `role` (ENUM: apprenant, parent, etablissement, dges, admin)
- `hash_mot_de_passe` (VARCHAR)
- `actif` (BOOLEAN)
- `derniere_connexion` (TIMESTAMP)

**`parent_apprenant`** — liens familiaux
- `id` (PK, UUID)
- `parent_user_id` (FK)
- `apprenant_nip` (FK)
- `relation` (ENUM: pere, mere, tuteur)

---

## 4. Architecture des API

### 4.1 Endpoints principaux

**Authentification**
- `POST /auth/inscription` — création de compte (apprenant ou parent)
- `POST /auth/connexion` — authentification (NIP + mot de passe)
- `POST /auth/refresh` — rafraîchir le token
- `POST /auth/deconnexion` — déconnexion

**Apprenant**
- `GET /apprenant/:nip` — profil apprenant
- `GET /apprenant/:nip/notes` — notes (sync EducMaster)
- `GET /apprenant/:nip/parcours` — historique du parcours
- `GET /apprenant/:nip/preferences` — préférences saisies
- `POST /apprenant/:nip/preferences` — sauvegarder les préférences
- `GET /apprenant/:nip/favoris`, `PUT` et `DELETE /apprenant/:nip/favoris/:filiereId` — formations mises de côté

**Catalogue**
- `GET /filiere` — liste (filtres : type, niveau, département, domaine, série de bac, bourses, source officielle, recherche sans accents)
- `GET /filiere/filtres` — valeurs des filtres (domaines avec leur nombre de filières, séries du bac)
- `GET /filiere/:id` — détail d'une filière
- `GET /filiere/:id/debouches` — débouchés et taux d'insertion
- `GET /etablissement` — liste des établissements
- `GET /etablissement/:id` — détail d'un établissement

**Orientation**
- `GET /orientation/:nip/recommandations` — recommandations du moteur
- `POST /orientation/:nip/calcul` — déclencher le calcul
- `GET /orientation/:nip/explain/:recommandation_id` — explication d'une reco

**Conseiller IA**
- `POST /conseiller/:nip/chat` — message au conseiller
- `GET /conseiller/:nip/historique` — historique des conversations
- `POST /conseiller/:nip/voice` — message vocal (STT → LLM → TTS)

**Pilotage (DGES/Central)**
- `GET /stats/national` — indicateurs nationaux
- `GET /stats/departement/:code` — indicateurs par département
- `GET /stats/filiere` — répartition par filière
- `GET /stats/flux` — flux d'orientation
- `GET /stats/export/:format` — export rapports (PDF, Excel)

**Admin**
- `GET /admin/utilisateurs` — gestion des utilisateurs
- `PUT /admin/filiere/:id` — mise à jour du catalogue
- `POST /admin/sync/educmaster` — déclencher synchronisation
- `GET /admin/logs` — journaux d'activité

### 4.2 Authentification et authorization

```
Requête → Nginx → NestJS (JWT guard) → Contrôleur → Service → Base
                        │
                        ├── Role: apprenant → accès à son dossier
                        ├── Role: parent → accès dossiers enfants
                        ├── Role: etablissement → suivi élèves étab.
                        ├── Role: dges → stats + pilotage
                        └── Role: admin → configuration + sync
```

### 4.3 Intégration EducMaster

```
Mon Orientation                    EducMaster (SIGE)
     │                                    │
     │──── GET /api/educmaster/nip ──────>│
     │<──── { nom, prenom, notes... } ───│
     │                                    │
     │──── POST /api/educmaster/sync ────>│
     │<──── { status: ok, count: N } ───│
     │                                    │
     │  Fréquence : sync quotidienne 02h00
     │  + sync à la demande (login apprenant)
     │  + cache Redis (TTL 1h)
```

---

## 5. Sécurité

### 5.1 Authentification

- **JWT** avec access token (15min) + refresh token (7 jours)
- **NIP** comme identifiant unique (pas de login par email seul)
- **Rate limiting** sur les endpoints d'auth (anti force brute)
- **MFA** optionnel pour les rèles admin/dges

### 5.2 Protection des données

- **Chiffrement TLS 1.3** pour toutes les communications
- **Chiffrement au repos** pour les données sensibles (notes, conversations IA)
- **RGPD-equivalent** : consentement, droit d'accès, de suppression
- **Anonymisation** des données dans les logs
- **Retention** : suppression des conversations IA après X mois

### 5.3 Sécurité applicative

- **Validation** de toutes les entrées (DTO + Zod)
- **SQL injection** : ORM Prisma (paramétrage automatique)
- **XSS** : échappement automatique React + CSP headers
- **CSRF** : tokens CSRF pour les formulaires
- **CORS** : restrictions par domaine

---

## 6. Mode hors-ligne

### 6.1 Contenus consultables hors-ligne

- Catalogue des filières (fiches complètes)
- Guide d'orientation par palier
- Contenus vidéo (téléchargés au préalable)
- Profil de l'apprenant et recommandations précédentes
- FAQ et questions fréquentes

### 6.2 Stratégie de cache

**Web (PWA)** :
- Service Worker pour la mise en cache des assets et pages
- IndexedDB pour les données structurées
- Sync backgroud quand la connexion revient

**Mobile (Flutter)** :
- Hive/SQLite pour les données locales
- Téléchargement sélectif des contenus
- File d'attente de soumissions (sync quand en ligne)

### 6.3 Fonctionnalités en ligne uniquement

- Soumission des préférences
- Interaction avec le conseiller IA
- Calcul des recommandations
- Synchronisation avec EducMaster

---

## 7. Déploiement

### 7.1 Environnements

| Environnement | Usage | URL |
|---|---|---|
| **Development** | Développement local | `localhost:3000` (web), `localhost:8080` (API) |
| **Staging** | Tests et validation | `staging.monorientation.bj` |
| **Production** | Utilisateurs finaux | `monorientation.bj` |

### 7.2 Pipeline CI/CD

```
Code push → GitHub Actions → Tests → Build → Deploy
                                    │
                                    ├── Lint + Type check
                                    ├── Tests unitaires
                                    ├── Tests d'intégration
                                    ├── Build Docker
                                    └── Deploy (staging auto, prod manuel)
```

### 7.3 Monitoring

- **Application** : métriques métier (orientations, conversations IA)
- **Infrastructure** : CPU, RAM, disque, réseau
- **Erreurs** : Sentry (application), logs structurés (Pino)
- **Alertes** : Grafana + webhook (Slack/Telegram)

---

## 8. Planning technique

| Phase | Période | Livrables |
|---|---|---|
| **Setup** | Sem 1 | Repo, CI/CD, Docker, DB, auth de base |
| **Backend core** | Sem 2-3 | API EducMaster, catalogue, moteur d'orientation |
| **Frontend web** | Sem 2-4 | Pages principales, catalogue, espace apprenant |
| **Mobile** | Sem 3-5 | App Flutter, catalogue, profil, hors-ligne |
| **IA** | Sem 4-6 | Conseiller IA (texte), RAG, base de connaissances |
| **Stats** | Sem 5-6 | Tableaux de bord, exports |
| **QA** | Sem 6-7 | Tests, corrections, optimisation |
| **Déploiement** | Sem 7-8 | Mise en prod, documentation |

---

## 9. Risques et mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| API EducMaster non documentée | Bloquant | Contact équipe Tics Master dès le début |
| Performance LLM pour le conseiller | Élevé | Cache des réponses, modèle optimisé, fallback texte |
| Connexion internet instable (zones rurales) | Élevé | Mode hors-ligne robuste, sync différée |
| Délai serré (MVP fin octobre) | Élevé | Scope MVP strict, features non critiques reportées |
| Protection des données élèves | Critique | Audit sécurité, chiffrement, consentement |
| Multi-langues : vocal en langues nationales | Moyen | Texte en fongbé déjà possible via Gemini ; pas d'API « J'aime ma langue » à ce jour : partenariat ASIN/IIDIA à demander par le MESTFP, Meta MMS (licence non commerciale) en solution d'attente |
