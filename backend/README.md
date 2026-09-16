# Mon Orientation — Backend (API)

API REST de la plateforme nationale d'orientation scolaire. Elle gère l'authentification et les droits d'accès, le catalogue des filières, les dossiers des apprenants (notes, vœux), le moteur d'orientation, le conseiller pédagogique et les statistiques de pilotage.

- **Base des routes** : `http://localhost:8080/api`
- **Documentation interactive** : `http://localhost:8080/api/docs` (Swagger / OpenAPI)

---

## Sommaire

1. [Stack](#stack)
2. [Structure](#structure)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Scripts](#scripts)
6. [Base de données](#base-de-données)
7. [Référentiel des filières](#référentiel-des-filières)
8. [Données de démonstration](#données-de-démonstration)
9. [Authentification et droits d'accès](#authentification-et-droits-daccès)
10. [Référence de l'API](#référence-de-lapi)
11. [Moteur d'orientation](#moteur-dorientation)
12. [Conseiller pédagogique](#conseiller-pédagogique)
13. [Tests](#tests)
14. [Limites connues et suite](#limites-connues-et-suite)
15. [Dépannage](#dépannage)

---

## Stack

| Élément | Choix |
|---|---|
| Framework | NestJS 10 (TypeScript 5) |
| ORM / base | Prisma 5.22 + PostgreSQL 16 |
| Authentification | Passport JWT : jeton d'accès (15 min) et jeton de rafraîchissement (7 jours, rotation) ; mots de passe hachés avec bcrypt (12 tours) |
| Validation | `class-validator` via une `ValidationPipe` globale (`whitelist`, `forbidNonWhitelisted`, `transform`) |
| Sécurité HTTP | `helmet` (CSP désactivée : API JSON + Swagger), CORS limité à `CORS_ORIGIN`, `@nestjs/throttler` |
| Documentation | `@nestjs/swagger` |
| Conseiller pédagogique | SDK officiel `@google/genai` : Gemini (`gemini-3.6-flash` par défaut) avec appel de fonctions côté serveur |
| Dépendances installées mais pas encore utilisées | `ioredis`, `bullmq` (cache et files), `minio` (fichiers), `zod` |

---

## Structure

```
backend/
├── prisma/
│   ├── schema.prisma                modèle de données
│   ├── migrations/                  init → referentiel_filieres → parcours_eleve → catalogue_favoris → guide_mesrs
│   ├── data/referentiel-filieres.ts formations après le BEPC (47, sources citées)
│   ├── data/guide-mesrs-2026-2027.json  formations du supérieur (225) et établissements (66), guide officiel du MESRS
│   ├── data/outils/extraire-guide-mesrs.py  extraction du guide (PDF hors dépôt) vers ce JSON
│   ├── seed.ts                      admin + référentiel (idempotent)
│   └── seed-demo.ts                 élèves, notes et comptes fictifs (interdit en production)
├── src/
│   ├── main.ts                      préfixe /api, helmet, CORS, ValidationPipe, Swagger
│   ├── app.module.ts                ConfigModule global, ThrottlerModule, modules métier
│   ├── prisma/                      PrismaService (module global)
│   ├── auth/                        inscription, connexion, refresh, /moi, gardes et décorateurs
│   │   ├── acces-apprenant.guard.ts accès au dossier :nip (élève, parent rattaché, admin)
│   │   ├── roles.guard.ts           @Roles(...) : restriction par rôle
│   │   └── throttler-identifiant.guard.ts  limitation par (IP, identifiant)
│   ├── apprenant/                   profil + bilan des notes, vœux, validation parent, formations mises de côté
│   │   └── bilan-notes.ts           moyennes par matière, points forts (fonction pure)
│   ├── orientation/                 moteur d'orientation et recommandations
│   │   └── profils-filieres.ts      matières clés et seuils par filière, compatibilité des séries
│   ├── filiere/                     catalogue (public) : recherche sans accents, filtres, séries du bac
│   │   └── domaines.ts              domaines (secteurs d'activité) du catalogue
│   ├── conseiller/                  conseiller pédagogique : consignes, outils, boucle d'appels à Gemini
│   └── stats/                       indicateurs de pilotage (DGES / admin)
├── setup.sh                         installation : dépendances, .env, Prisma, migrations, seed
└── .env.example
```

---

## Installation

Prérequis : Node.js 22 et le conteneur PostgreSQL du `docker-compose.yml` racine (`docker compose up -d`).

```bash
cd backend
bash setup.sh                 # npm install, .env, prisma generate, migrate deploy, seed
npm run prisma:seed:demo      # facultatif : données de démonstration
npm run start:dev             # API en mode watch sur :8080
```

À la main, les étapes de `setup.sh` sont :

```bash
npm install
cp .env.example .env          # puis renseigner JWT_SECRET
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
```

---

## Configuration

Variables lues dans `backend/.env` :

| Variable | Obligatoire | Défaut | Rôle |
|---|---|---|---|
| `DATABASE_URL` | oui | — | Connexion PostgreSQL (`postgresql://mo_user:mo_password@localhost:5434/mon_orientation` en local) |
| `JWT_SECRET` | **oui** | — | Signature des jetons ; **le serveur refuse de démarrer sans** |
| `JWT_REFRESH_SECRET` | non | `${JWT_SECRET}-refresh` | Signature des jetons de rafraîchissement |
| `JWT_EXPIRATION` | non | `15m` | Durée du jeton d'accès |
| `JWT_REFRESH_EXPIRATION` | non | `7d` | Durée du jeton de rafraîchissement (et de la session) |
| `PORT` | non | `8080` | Port HTTP |
| `CORS_ORIGIN` | non | `http://localhost:3000` | Origine autorisée pour le frontend |
| `TRUST_PROXY` | non | `false` | `true` derrière nginx, pour que la limitation des tentatives voie l'IP réelle |
| `SEED_ADMIN_PASSWORD` | en production | `admin123` hors production | Mot de passe du compte admin créé par le seed |
| `NODE_ENV` | non | — | `production` interdit le seed de démonstration et impose `SEED_ADMIN_PASSWORD` |
| `REDIS_URL`, `MINIO_*` | non | — | Prévus (cache, fichiers), non utilisés à ce stade |
| `EDUCMASTER_API_URL` | non | — | Prévu pour l'intégration EducMaster (tâche 2.1), non utilisé |
| `GEMINI_API_KEY` | pour le conseiller | — | Clé de l'API Gemini (Google AI Studio) ; sans elle, le conseiller répond 503 « pas encore configuré » |
| `CONSEILLER_MODELE` | non | `gemini-3.6-flash` | Modèle Gemini utilisé par le conseiller (`gemini-3.8-flash` est limité à 20 requêtes par jour dans l'offre gratuite) |
| `CONSEILLER_MODELE_SECOURS` | non | `gemini-3.5-flash-lite` | Modèle de secours si le principal est surchargé ou a épuisé son quota ; vide pour désactiver |

Ne jamais versionner `.env`. En production, utiliser des secrets longs et aléatoires (par exemple `openssl rand -base64 48`).

---

## Scripts

| Script | Effet |
|---|---|
| `npm run start:dev` | API en mode watch (recompile et relance à chaque modification de `src/`) |
| `npm run build` / `npm run start:prod` | Compilation dans `dist/` / exécution compilée |
| `npm run prisma:generate` | Régénère le client Prisma après modification du schéma |
| `npm run prisma:migrate` | `prisma migrate dev` (création de migration, terminal interactif) |
| `npm run prisma:studio` | Interface web d'exploration de la base |
| `npm run prisma:seed` | Admin + référentiel des filières (idempotent) |
| `npm run prisma:seed:demo` | Élèves, notes et comptes de démonstration (idempotent, refusé si `NODE_ENV=production`) |
| `npx tsc --noEmit` | Vérification des types |

`npm run lint` et `npm run format` sont déclarés, mais ESLint et Prettier ne sont pas encore installés.

---

## Base de données

### Modèle

| Table | Contenu |
|---|---|
| `utilisateurs` | Comptes : NIP (élèves) ou email, rôle (`APPRENANT`, `PARENT`, `ETABLISSEMENT`, `DGES`, `ADMIN`), mot de passe haché, `actif` |
| `sessions` | Jetons émis : une session par jeton de rafraîchissement, supprimée à la rotation ou à la déconnexion |
| `apprenants` | Dossier élève identifié par le **NIP** : identité, département, commune, **classe** (`palier`), **série** ; rattaché au plus à un compte |
| `parent_apprenant` | Liens parent ↔ enfant (relation : père, mère, tuteur…) |
| `notes` | Notes par matière, trimestre et année scolaire (unicité sur ces quatre champs) |
| `filieres` | Catalogue : code unique, type, niveau d'accès, diplômes, métiers, débouchés, conditions, séries admises, lieux, bourses, taux d'insertion, **sources**, **domaines** (tableau de codes) ; pour le supérieur, données du guide du MESRS : places avec bourse, aides ou places partiellement payantes, mode d'entrée, séries et matières du classement, établissement |
| `etablissements` | Établissements du supérieur du guide du MESRS (code stable, sigle, université) ; prévu aussi pour la synchronisation EducMaster |
| `favoris` | Formations mises de côté par un élève (clé : NIP + filière, 50 au plus) ; supprimées avec l'élève ou la filière |
| `preferences` | Vœux : jusqu'à 3 filières par élève **et par classe** (unicité), motivation, validation parent |
| `recommandations` | Sorties du moteur : score, explication, **critères détaillés** (JSON), active ou archivée |
| `conversations_ia` | Historique des échanges avec le conseiller |

Énumérations : `Palier` (`QUATRIEME`, `TROISIEME`, `PREMIERE`, `TERMINALE`), `NiveauAcces` (`APRES_BEPC`, `APRES_BAC`), `TypeFiliere` (`GENERALE`, `TECHNIQUE`, `TECHNIQUE_AGRICOLE`, `PROFESSIONNELLE`, `ECOLE_METIER`, `UNIVERSITE`).

### Migrations

| Migration | Contenu |
|---|---|
| `20260913100532_init` | Schéma initial |
| `20260913133911_referentiel_filieres` | Filière : `code`, `niveauAcces`, `seriesAdmises`, `ouSeFormer`, `sources` ; `bourses` facultatif |
| `20260913155635_parcours_eleve` | Apprenant : `palier`, `serie` ; vœux uniques par classe, date de validation parent ; `criteres` des recommandations |
| `20260914155352_guide_mesrs` | Filière : `quotaBourses`, `quotaAides`, `modeEntree`, `seriesRecommandees`, `matieresClassement`, `matieresCles` ; établissement : `code` (unique), `sigle`, `universite`, département et commune facultatifs |
| `20260914000931_catalogue_favoris` | Extension `unaccent` (recherche sans accents, extension « de confiance » : pas besoin d'être superutilisateur) ; Filière : `domaines` ; table `favoris` |

Pour **créer une migration** dans un terminal interactif : `npm run prisma:migrate -- --name <nom>`.

Dans un environnement non interactif (CI, script, agent), `prisma migrate dev` refuse de s'exécuter. On génère alors la migration à partir de la base, puis on l'applique :

```bash
D="prisma/migrations/$(date +%Y%m%d%H%M%S)_<nom>" && mkdir -p "$D"
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma --script > "$D/migration.sql"
# relire le SQL généré, puis :
npx prisma migrate deploy && npx prisma generate
```

Utiliser toujours le binaire Prisma local (`npx` depuis `backend/`). Lancé depuis un autre dossier, `npx prisma` télécharge une autre version majeure, incompatible avec le client 5.x.

---

## Référentiel des filières

Le catalogue compte **272 formations**, de deux origines :

- **Supérieur public (225)** : extrait du *Guide d'information et de sensibilisation des nouveaux bacheliers 2026-2027* du MESRS (source officielle, page citée sur chaque fiche), avec ses 66 établissements. Le PDF reste hors dépôt ; `prisma/data/outils/extraire-guide-mesrs.py` (pdfplumber) produit `guide-mesrs-2026-2027.json`, lu par le seed. Le script normalise les séries (« C, D et DEAT/PV » → C, D, DEAT), rapproche les matières du classement de celles des bulletins, et garde leur code aux 19 anciennes fiches du supérieur qui ont un équivalent : leurs identifiants, vœux et favoris restent valides. Pour une nouvelle édition du guide : ajuster les pages de `SECTIONS`, relancer avec `--controle`, relire les contrôles, puis relancer le seed.
- **Après le BEPC (47)** : `prisma/data/referentiel-filieres.ts`, constitué à partir de sources publiques (Office du Baccalauréat, gouv.bj, communiqués du MESTFP relayés par la presse), à faire valider par le MESTFP.

Chaque filière a au moins un **domaine** parmi les 16 de `src/filiere/domaines.ts` (agriculture, numérique, santé, BTP…). Ce classement a été fait par l'équipe à partir des intitulés, et non repris des sources : il est à faire valider avec le référentiel. Le seed s'arrête si une filière n'a pas de domaine ou en a un inconnu.

| Famille | Nombre | Exemples de codes |
|---|---|---|
| Baccalauréat général | 5 | `BAC-A1`, `BAC-C`, `BAC-D` |
| Baccalauréat technique + DT | 9 + 5 | `BAC-F3`, `BAC-G2`, `BAC-EA`, `DT-DEV-WEB-MOBILE` |
| Formation professionnelle (DTM, EFMS) | 9 + 2 | `DTM-LTP-ELEC-ENERGIE`, `EFMS-HYGIENISTE-SALLES` |
| Technique agricole (DTM, DEAT) | 10 + 1 | `DTM-LTA-PORCINS`, `DEAT` |
| Écoles des métiers de référence | 6 | `EDM-NUMERIQUE` |
| Supérieur (UAC, INSTI, ENSET, IMSP) | 20 | `UNIV-FSS-MEDECINE`, `UNIV-EPAC-GC` |

Règles de rédaction :

- Le `code` est l'identifiant stable : le seed fait un *upsert* dessus. Modifier une entrée puis relancer `npm run prisma:seed` suffit à mettre la base à jour.
- Une information introuvable reste absente. Aucun taux d'insertion n'est renseigné, faute de donnée publique.
- Chaque entrée cite ses sources avec un indicateur `officielle` ; le frontend affiche « À confirmer » quand aucune n'est officielle.
- Les filières sans code (anciennes données de démonstration) sont supprimées par le seed, tant que rien ne les référence.

Le référentiel doit être **validé et complété par le ministère** : liste des établissements, taux d'insertion, offre universitaire complète.

---

## Données de démonstration

`npm run prisma:seed:demo` crée 3 élèves fictifs avec leurs notes des trois trimestres 2025-2026, plus un compte parent et un compte DGES. Le mot de passe est `Demo2026!`.

| NIP / identifiant | Profil | Compte |
|---|---|---|
| `DEMO-3E-0001` | Fatou, 3e, Littoral | oui |
| `DEMO-TLE-0001` | Koffi, Terminale D, Borgou | oui |
| `DEMO-4E-0001` | Adama, 4e, Zou | non : inscription avec la date de naissance 2012-07-08 |
| `parent.demo@monorientation.bj` | Moussa, père de Fatou | oui |
| `dges.demo@monorientation.bj` | DGES | oui |

Les matières utilisées sont Mathématiques, PCT, SVT, Français, Anglais, Histoire-Géographie, EPS, et Philosophie en Terminale. Les profils du moteur s'appuient sur ces libellés.

---

## Authentification et droits d'accès

### Parcours

1. **Inscription**, `POST /auth/inscription` :
   - **élève** : NIP et **date de naissance**, qui doivent correspondre à un dossier existant pas encore rattaché à un compte. C'est une vérification provisoire, en attendant l'authentification EducMaster ;
   - **parent** : email obligatoire, sans NIP. Le rattachement parent-enfant est fait par l'établissement ou l'administration, jamais par le parent lui-même ;
   - les rôles `ETABLISSEMENT`, `DGES` et `ADMIN` ne peuvent pas s'auto-inscrire (400).
2. **Connexion**, `POST /auth/connexion` : `identifiant` (NIP ou email) et `motDePasse`. La réponse contient `user`, `accessToken` et `refreshToken`.
3. **Appels authentifiés** : en-tête `Authorization: Bearer <accessToken>`.
4. **Rafraîchissement**, `POST /auth/refresh` : chaque jeton de rafraîchissement ne sert qu'une fois ; il est révoqué et remplacé par une nouvelle paire (rotation).
5. **Déconnexion**, `POST /auth/deconnexion` (authentifiée) : révoque toutes les sessions de l'utilisateur.

### Règles d'accès

| Ressource | Qui y a accès |
|---|---|
| Catalogue (`/filiere`) | Public |
| Dossier d'un élève (`/apprenant/:nip`, `/orientation/:nip`, `/conseiller/:nip`) | L'élève lui-même, un **parent rattaché**, un administrateur (`AccesApprenantGuard`) |
| Saisie des vœux | L'élève uniquement |
| Validation des vœux | Le parent rattaché uniquement |
| Formations mises de côté | Consultation : dossier ; ajout et retrait : l'élève uniquement |
| Statistiques (`/stats`) | `DGES`, `ADMIN` (`RolesGuard`) |

Les autres cas renvoient 403. Le DGES n'a pas accès aux dossiers individuels. L'accès du rôle `ETABLISSEMENT` à ses élèves reste à implémenter (tâche 2.10).

### Protections

- `JWT_SECRET` obligatoire ; chaque jeton porte un identifiant unique (`jti`).
- Limitation à **5 tentatives par minute** sur la connexion et l'inscription, comptées par couple (IP, identifiant). Dans un établissement, beaucoup d'élèves partagent la même connexion : un blocage par IP seule gênerait toute une classe.
- Messages d'erreur génériques (« Identifiants invalides », « NIP ou date de naissance incorrects… »), pour ne pas révéler quels comptes existent.
- Toutes les entrées passent par des DTO validés ; les champs inconnus sont rejetés.

---

## Référence de l'API

Toutes les routes sont préfixées par `/api`. « Dossier » désigne l'accès décrit plus haut : l'élève, un parent rattaché ou un admin.

### Authentification

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/auth/inscription` | public (5/min) | Créer un compte élève (NIP + date de naissance) ou parent (email) |
| POST | `/auth/connexion` | public (5/min) | Se connecter avec un NIP ou un email |
| POST | `/auth/refresh` | public | Échanger un jeton de rafraîchissement (rotation) |
| POST | `/auth/deconnexion` | connecté | Révoquer toutes les sessions |
| GET | `/auth/moi` | connecté | Profil, dossier élève rattaché (`apprenant`), enfants (`enfants`) avec leur classe |

### Catalogue

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/filiere` | public | Liste paginée ; filtres `type`, `niveau` (`APRES_BEPC`, `APRES_BAC`), `departement`, `search`, `serie` (ex. `D`), `domaine`, `bourses` et `officielle` (`true` ou `false`), `page`, `limit` (500 au maximum). Un paramètre répété ou une valeur inconnue renvoie 400 |
| GET | `/filiere/filtres` | public | Valeurs des filtres : domaines (libellé, nombre de filières) et séries du bac (libellé, fiche du bac) |
| GET | `/filiere/:id` | public | Fiche complète (sources et domaines inclus) |
| GET | `/filiere/:id/debouches` | public | Débouchés, métiers, taux d'insertion |

- **Recherche** (`search`) : insensible à la casse et aux accents (« electricite », « oeuvre »). Elle porte sur le nom, le code, la description, les débouchés, les métiers, les diplômes, le lieu de formation et les domaines. Les filières dont le nom contient le texte viennent en premier.
- **Série** (`serie`) : ne garde que les filières du supérieur qui admettent la série, avec la même règle que le moteur (`compatibiliteSerie`). Chaque résultat porte `accesSerie` : `ADMISE` ou `SOUS_CONDITIONS`. Les filières dont les séries admises ne sont pas renseignées sont écartées.
- **Source officielle** (`officielle=false`) : liste les fiches encore à confirmer, pratique pour la relecture par le ministère.

### Apprenant

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/apprenant/:nip` | dossier | Profil (classe, série, département) et **bilan** : moyennes par matière, moyenne générale, points forts, matières à renforcer |
| GET | `/apprenant/:nip/notes` | dossier | Notes brutes |
| GET | `/apprenant/:nip/parcours` | dossier | Années scolaires suivies |
| GET | `/apprenant/:nip/preferences` | dossier | Vœux par classe, filières incluses |
| POST | `/apprenant/:nip/preferences` | élève | Enregistrer ses vœux, en 3e ou en Terminale ; recalcule les recommandations |
| POST | `/apprenant/:nip/preferences/validation` | parent | Valider les vœux de l'enfant |
| GET | `/apprenant/:nip/favoris` | dossier | Formations mises de côté, les plus récentes d'abord (`filiereId`, `ajouteLe`, `filiere`) |
| PUT | `/apprenant/:nip/favoris/:filiereId` | élève | Mettre une formation de côté (204, sans effet si elle l'est déjà ; 400 au-delà de 50 ; 404 si la filière n'existe pas) |
| DELETE | `/apprenant/:nip/favoris/:filiereId` | élève | Retirer une formation mise de côté (204, sans effet si elle ne l'était pas) |

Corps de `POST /preferences` :

```json
{ "filiereId1": "uuid", "filiereId2": "uuid", "filiereId3": "uuid", "motivation": "texte (≤ 1000)" }
```

Règles appliquées :

- 1 à 3 vœux distincts, et pas de 3e vœu sans 2e ;
- filières du niveau de la classe (après le BEPC en 3e, après le bac en Terminale) ;
- saisie refusée en 4e et en 1re (400) ;
- toute modification des vœux annule la validation du parent ; un ré-enregistrement à l'identique la conserve.

### Orientation

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/orientation/:nip/recommandations` | dossier | Recommandations actives de la classe actuelle, triées par score |
| POST | `/orientation/:nip/calcul` | dossier | Recalcule les recommandations (les précédentes sont archivées) |
| GET | `/orientation/:nip/explain/:id` | dossier | Détail d'une recommandation de ce dossier (404 sinon) |

Chaque recommandation contient `score` (0 à 100), `explication` (texte) et `criteres`, une liste de `{ critere, points, detail, alerte?, rang? }`.

### Conseiller et statistiques

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/conseiller/:nip/chat` | élève, parent rattaché (10/min par compte) | Question `{ message (≤ 2000), conversationId?, langue? }` → `{ conversationId, reponse, outilsUtilises }`. `langue` : `fr` (par défaut) ou `fon` (réponse rédigée en fongbé, enregistrée avec la conversation) ; 503 sans clé API |
| GET | `/conseiller/:nip/historique` | dossier | 10 dernières conversations |
| GET | `/stats/national` | DGES, admin | Effectifs, nombre de filières et d'établissements, répartition par type |
| GET | `/stats/departement/:code` | DGES, admin | Indicateurs d'un département |
| GET | `/stats/filiere` | DGES, admin | Répartition et taux d'insertion moyen par type |

---

## Moteur d'orientation

Le code se trouve dans `src/orientation/orientation.service.ts` et `profils-filieres.ts`. Le moteur **propose, il ne décide pas** : chaque point du score est justifié par une phrase adressée à l'élève.

1. **Filières candidates** selon la classe :
   - en 4e et en 3e, filières accessibles après le BEPC (en 4e : « pistes à explorer ») ;
   - en 1re et en Terminale, filières accessibles après le bac, dont les **séries admises** incluent celle de l'élève. Une filière réservée aux bacs techniques est exclue pour un bac général ; une filière « sous conditions » est pénalisée.
2. **Barème sur 100** :

| Critère | Points |
|---|---|
| Résultats dans les **matières clés** de la filière (8/20 donne 0, 16/20 ou plus donne le maximum) | jusqu'à 60 |
| Sans matière clé identifiée : moyenne générale comptée pour moitié | jusqu'à 30 |
| Vœu de l'élève : 1er / 2e / 3e choix | 30 / 20 / 10 |
| Seuil publié non atteint (par exemple 12/20 dans les matières de spécialité pour un bac technique, 10/20 pour un DTM) | −15 (alerte) |
| Série admise sous conditions | −10 (alerte) |
| Taux d'insertion, uniquement s'il est connu | jusqu'à 10 |

3. **Sélection** : les 5 meilleures filières, avec **au plus deux par famille** (par type au secondaire, par établissement au supérieur) pour varier les propositions. Les vœux de l'élève sont toujours évalués, même hors du top 5.
4. **Historique** : les anciennes recommandations sont désactivées, pas supprimées.

Le bilan des notes (`src/apprenant/bilan-notes.ts`) porte sur l'année scolaire la plus récente. Les moyennes sont ramenées sur 20 **sans coefficients** : ils seront appliqués avec les données EducMaster. Une matière est un point fort à partir de 14/20 et à renforcer sous 10/20.

**À valider** : les matières clés et les seuils par filière sont une première version déduite des intitulés et des conditions publiées, à valider par les conseillers d'orientation de la DGES. En l'état, de nombreuses filières partagent le même profil, ce qui produit des égalités de score.

---

## Conseiller pédagogique

Le conseiller est un **prototype du niveau B** : il informe et **explique les propositions du moteur**, mais ne formule pas de recommandation lui-même (« le moteur propose, le conseiller explique »). Ce périmètre correspond au point 5 des arbitrages du SPEC et reste à confirmer par le client.

Le code se trouve dans `src/conseiller/` :

| Fichier | Rôle |
|---|---|
| `prompt-conseiller.ts` | Consignes fixes (rôle, sources, neutralité, orientation vers un adulte en cas de détresse, style), puis une précision selon l'interlocuteur (élève tutoyé, parent vouvoyé) |
| `outils-conseiller.ts` | Outils proposés au modèle et exécutés côté serveur |
| `conseiller.service.ts` | Boucle d'appels, conversations, gestion des erreurs |

### Outils

| Outil | Source | Contenu renvoyé |
|---|---|---|
| `rechercher_filieres` | `FiliereService.findAll` | 12 formations au plus : code, nom, type, niveau, séries admises, lien |
| `fiche_filiere` | `FiliereService.findByCode` | Fiche complète, avec l'indication « source officielle » ou non |
| `evaluer_filiere` | `OrientationService.evaluerFiliere` | Avis du moteur sur une formation choisie par l'élève, sans rien enregistrer |

**Contexte joint à chaque question** (`OutilsConseillerService.contexteEleve`) : le dossier de l'élève (classe, série, département, moyennes, points forts, vœux) et les propositions actuelles du moteur avec leurs critères, calculées si besoin. Il est **pseudonymisé : ni nom, ni NIP, ni date de naissance, ni commune, ni motivation écrite**. Le joindre directement évite un appel de fonction à chaque question, ce qui ménage le quota gratuit de Gemini.

Aucun outil ne prend de NIP en paramètre : le dossier consulté est toujours celui de la route, déjà contrôlé par `AccesApprenantGuard`. Chaque formation citée porte un lien `/catalogue/<id>`, que le frontend est seul à rendre cliquable.

### Appel au modèle

- `client.models.generateContent` (SDK `@google/genai`) avec `gemini-3.6-flash` : les consignes passent en `systemInstruction`, les outils en `functionDeclarations` (schémas JSON).
- **Boucle bornée** à 6 appels au modèle par question. Les résultats des fonctions sont renvoyés ensemble, dans un seul message (`functionResponse`, avec `output` ou `error`). Le contenu du modèle est renvoyé tel quel au tour suivant, car il porte les signatures de réflexion.
- **Filtres de sécurité** : si Gemini bloque la question (`promptFeedback.blockReason`) ou la réponse (arrêt `SAFETY`, `PROHIBITED_CONTENT`, `BLOCKLIST`, `SPII`, `RECITATION`), l'élève reçoit une réponse neutre.
- **Cache** : Gemini réutilise automatiquement un début de requête identique. Les consignes et les outils sont donc placés en tête et ne changent jamais ; chaque appel journalise `cache=` (jetons relus) et `réflexion=`.
- **Modèle de secours** : si le modèle principal renvoie 429, 500, 503 ou 504 à n'importe quel moment (surcharge ou quota épuisé, fréquent sur l'offre gratuite), la question **repart de zéro** sur `CONSEILLER_MODELE_SECOURS`, qui a son propre quota. On repart de zéro car les signatures de réflexion déjà reçues sont propres au premier modèle. Le SDK ne fait qu'une seule relance (`retryOptions.attempts: 2`, contre 5 par défaut), pour basculer vite.
- **Erreurs** : clé refusée (400, 401 ou 403 : Gemini répond 400 pour une clé invalide) → 503 ; quota atteint (429) → 429 ; autre erreur de l'API ou du réseau → 503.
- **Conversations** : chaque session a sa conversation (`conversations_ia`), qui ne conserve que le texte des échanges et la liste des outils utilisés. Les 20 derniers messages sont renvoyés au modèle.

### Mettre en service

1. Créer une clé sur [Google AI Studio](https://aistudio.google.com). C'est gratuit et ne demande pas de carte bancaire.
2. Ajouter `GEMINI_API_KEY=…` dans `backend/.env`, puis relancer le backend : `nest start --watch` ne relit pas `.env` tout seul.
3. Vérifier avec des appels réels : `CONSEILLER_TEST_LLM=1 bash tests/api/conseiller.sh`, puis `node tests/e2e/conseiller.mjs`.

**Offre gratuite : réservée à la démonstration.** Elle ne coûte rien, mais son quota est limité (consultable dans AI Studio), et chaque question peut consommer plusieurs requêtes à cause des appels de fonctions. Surtout, d'après la page officielle des tarifs, **Google peut utiliser les échanges de l'offre gratuite pour améliorer ses produits** : seules les données de démonstration peuvent y passer, jamais celles de vrais élèves. Les quotas gratuits varient beaucoup d'un modèle à l'autre : le 13/09/2026, `gemini-3.8-flash` était limité à 20 requêtes par jour, d'où le choix de `gemini-3.6-flash` par défaut. Les quotas du projet sont consultables sur [aistudio.google.com/rate-limit](https://aistudio.google.com/rate-limit). En production, il faudra l'offre payante, où les données ne servent pas à l'entraînement, au tarif indiqué pour le modèle retenu sur la [page officielle des tarifs](https://ai.google.dev/gemini-api/docs/pricing). L'autre option est un modèle hébergé au Bénin.

### Avant la production

- Le client doit confirmer le niveau B, et le ministère décider de l'hébergement des données envoyées au modèle (APDP). L'offre gratuite de Gemini est exclue pour des données réelles.
- Il manque un outil de supervision (relecture des conversations signalées ou tirées au sort) et un jeu d'une centaine de questions types validées par les conseillers d'orientation, à rejouer avant chaque mise en production.
- Les réponses ne sont pas encore diffusées en continu (streaming).
- Langues nationales : le fongbé écrit passe déjà par Gemini (`langue: "fon"`), avec une qualité jugée correcte sur un premier échantillon, à faire relire plus largement. Les messages fixes (refus, erreurs) restent en français. Pour la voix et les autres langues, « J'aime ma langue » n'offre pas d'API publique à ce jour (voir ARCHITECTURE §2.4).

---

## Tests

Les tests de bout en bout se trouvent dans le dossier racine `tests/`, et s'exécutent avec l'API lancée :

```bash
bash tests/api/securite.sh        # 37 vérifications
bash tests/api/parcours-eleve.sh  # 38 vérifications (nécessite le seed de démonstration)
bash tests/api/conseiller.sh      # 11 vérifications sans appel au modèle ; 22 avec CONSEILLER_TEST_LLM=1 (appels réels, dont une réponse en fongbé)
bash tests/api/catalogue.sh       # 66 vérifications : recherche, filtres, séries, domaines, supérieur (guide du MESRS), formations mises de côté
```

Il n'y a pas encore de tests unitaires (Jest n'est pas configuré) : c'est l'objet des tâches 7.1 et 7.3.

---

## Limites connues et suite

- **EducMaster** non connecté (tâche 2.1) : les notes proviennent du seed de démonstration.
- **Conseiller pédagogique** : prototype du niveau B, pas encore testé avec une vraie clé. Supervision, jeu de questions de référence, streaming et hébergement des données restent à faire (voir [Conseiller pédagogique](#conseiller-pédagogique)).
- **Rôle établissement** sans accès aux dossiers ; pas encore d'écran d'administration pour le rattachement parent-enfant ni pour le référentiel (tâche 3.10).
- **Filière ↔ établissement** : une filière ne peut être rattachée qu'à un seul établissement. Le champ texte `ouSeFormer` sert en attendant une relation plusieurs-à-plusieurs.
- **Infrastructure** : Redis, BullMQ et MinIO ne sont pas utilisés ; il n'y a pas de Dockerfile (`docker-compose.dev.yml` n'est pas encore fonctionnel) ni d'intégration continue.

---

## Dépannage

| Symptôme | Solution |
|---|---|
| `Error: Configuration key "JWT_SECRET" does not exist` au démarrage | Renseigner `JWT_SECRET` dans `.env` |
| L'API sert l'ancien code alors que `dist/` est à jour | Un `node dist/main` orphelin tient le port 8080 : `ss -ltnp \| grep :8080`, arrêter le processus. `nest start --watch` ne relance son serveur qu'après un vrai changement de contenu dans `src/` (un simple `touch` ne suffit pas) |
| `npx prisma …` télécharge prisma 8 | Commande lancée hors de `backend/` : se placer dans `backend/` |
| `P2002` (contrainte d'unicité) à l'inscription | Un compte existe déjà pour ce NIP ou cet email (l'API renvoie normalement 409) |
| Le conseiller répond « pas encore configuré » | `GEMINI_API_KEY` absente de `.env` : l'ajouter, puis relancer le backend |
| 429 à la connexion | Plus de 5 tentatives en une minute pour cet identifiant depuis cette IP : patienter une minute |
