# Journal de bord

> Permet à toute nouvelle session (même depuis un autre compte) de reprendre le
> travail sans relire l'historique de conversation. Lis "État actuel" d'abord,
> puis les entrées récentes de "Historique" si besoin.

## État actuel

- **Étape du pipeline** : développement MVP — parcours élève web opérationnel sur données de démonstration
- **En cours** : rien — tout est commité et poussé sur `origin/main` (Team-D-MESRS/Mon-Orientation)
- **Documents locaux** : le cahier des charges (`docs/`) et la note de cadrage du client restent sur la machine de l'utilisateur, hors dépôt (`.gitignore`), à sa demande.
- **Bloqué / en attente de** : coordonnées et mentions légales à fournir par le MESTFP (contact, directeur de la publication, hébergeur, délégué aux données, durée de conservation → `frontend/src/lib/site.ts`) ; validation client du référentiel filières et du moteur (barème, matières clés, seuils : conseillers d'orientation DGES) ; arbitrages SPEC §7 (appliqué par défaut : vœux saisis par l'élève, validés par le parent) ; accès API EducMaster (2.1)
- **Prochaine action recommandée** : 00) l'utilisateur régénère sa clé Gemini (collée en clair dans la conversation) et met la nouvelle dans `backend/.env` ; 0) l'utilisateur complète le nom du prestataire dans `docs/Cahier_des_charges_Mon_Orientation_v1.0.docx` et le présente au MESTFP ; 1) présenter le parcours au client et faire valider le moteur, ainsi que les domaines du catalogue ; 2) conseiller IA réel (5.1/5.2) une fois son périmètre arbitré ; 3) écran d'administration du référentiel (3.10 : fiches, statut « validé par le ministère », historique ; le seed réécrit aujourd'hui les fiches à chaque lancement, à adapter) + rôle ÉTABLISSEMENT et rattachement parent-enfant ; 4) statistiques branchées sur l'API (6.1/6.3) ; 5) projet Flutter ; 6) tests unitaires + CI (1.8)
- **Dernière mise à jour** : 2026-09-14 04:15 — accueil refait (fil principal)

## Historique

*(plus récent en haut)*

### 2026-09-14 05:40 — animations au défilement sur l'accueil (fil principal)
- Fait : composants `Apparition` (fondu au défilement, IntersectionObserver, sans bibliothèque) et `Compteur` (`frontend/src/components/animation/`) ; cascade du bandeau, cartes et domaines décalés, bulles du conseiller l'une après l'autre, compteur du nombre de formations.
- Garde-fous : masquage seulement si `layout.tsx` pose `data-animations` avant le premier affichage (pas sans JavaScript, pas avec « réduire les animations », jamais à l'impression) ; compteur caché aux lecteurs d'écran, qui lisent la phrase fixe.
- Tests : `accueil.mjs` 14 vérifications (défilement complet, animations réduites, pas d'erreur d'hydratation) ; `cdp.mjs` émule les préférences système.

### 2026-09-14 05:00 — tableau de bord sans redondance (fil principal)
- Constat : la « double page » signalée (« Tableau de bord personnel », Adama Kouassi) était un onglet périmé du navigateur ; cette maquette du premier commit n'existe plus (ni code, ni cache, ni JS servi).
- Fait : carte « Profil » supprimée (elle répétait classe et NIP de l'en-tête) ; le département passe dans l'en-tête de l'espace ; rangée du haut en 2 cartes (Résultats, Orientation). Test du parcours complété.

### 2026-09-14 04:15 — accueil refait (fil principal)
- Fait : bandeau avec recherche (formulaire GET vers `/catalogue?q=`, marche sans JavaScript) et raccourci « Que faire après mon bac ? » (une pastille par série) ; entrées par profil (4e-3e, 1re-Terminale, parent) ; 4 étapes fidèles au parcours ; domaines avec leur nombre de formations ; conseiller en fongbé (exemple validé) ; engagements. Boutons selon la connexion (Se connecter / Mon espace / Tableau de bord).
- Retiré : « Plus de 100 filières », langues non disponibles (yoruba, bariba, dendi), lien Statistiques public, émojis. Chiffres lus dans l'API (`components/accueil/useCatalogueAccueil.ts`, une seule requête partagée). DESIGN.md (maquette de l'accueil) mis à jour.
- Tests : `tests/e2e/accueil.mjs` 10/10, pied de page 23/23.

### 2026-09-14 03:30 — conseiller en fongbé (fil principal)
- Constat : « J'aime ma langue » (ASIN/IIDIA, lancé le 10/11/2025) collecte des voix pour entraîner des modèles, **sans API publique** ; Cloud Translation (Google) ne liste pas le fon (le site Google Traduction le traduit, mais son service web n'est pas une API utilisable). Gemini rédige en fongbé : l'utilisateur a jugé la traduction correcte sur 3 phrases.
- Fait : paramètre `langue` (`fr` | `fon`, validé) du chat → consigne « réponds en fongbé » (`CONSIGNE_LANGUE`, après le préfixe mis en cache), langue enregistrée avec la conversation ; sélecteur Français / Fɔ̀ngbè dans l'écran du conseiller (retenu par l'appareil, `lang="fon"`, mention « rédigées automatiquement »). ARCHITECTURE §2.4 et risques corrigés.
- Tests : conseiller API 11/11 (+ refus d'une langue inconnue ; 22 avec `CONSEILLER_TEST_LLM=1`), navigateur 8/8 ; une vraie question en fongbé : réponse en fongbé avec 5 liens vers les fiches. Un 503 passager de Gemini observé puis disparu à la relance.
- Suite : faire relire des réponses plus longues par des locuteurs ; messages fixes (refus, erreurs) encore en français ; voix : partenariat ASIN/IIDIA ou Meta MMS (licence non commerciale).

### 2026-09-14 02:40 — pages d'information et pied de page (fil principal)
- Fait : 7 liens morts (`href="#"`) du pied de page remplacés par de vraies pages dans le groupe `(informations)` : guide, faq, contact, mentions-legales, donnees-personnelles, accessibilite (navigation commune), plus une 404 en français. Pied de page toujours en bas (body en colonne, `main` en `flex-1`), liens selon le rôle partagés avec l'en-tête (`components/layout/navigation.ts`), contrastes relevés, « Gouvernement du Bénin » → gouv.bj, ajout d'apresmonbac.bj (adresses vérifiées).
- Décision : aucune coordonnée officielle inventée ; les valeurs manquantes (`frontend/src/lib/site.ts`, à `null`) sont signalées sur les pages. Mentions légales et données personnelles marquées « provisoire, à valider par le Ministère ».
- Piège corrigé : `.bj-container` (déclarée après les utilitaires Tailwind) écrasait `py-*` / `my-*` posés sur le même élément (404, barre du comparateur, squelette du catalogue, `RequireAuth`, erreur de l'espace) ; elle ne fixe plus que l'horizontal.
- Tests : `tests/e2e/pied-de-page.mjs` 23/23 ; catalogue 28, parcours 10, connexion 8, conseiller 6 toujours au vert. Le test navigateur du conseiller dépend de la réponse réelle de Gemini (lien vers une fiche attendu) : un échec isolé a été observé, puis 6/6 à la relance.

### 2026-09-14 01:30 — catalogue enrichi (fil principal)
- Fait (backend) : migration `catalogue_favoris` (extension `unaccent`, `filieres.domaines`, table `favoris`) ; recherche sans accents sur nom, métiers, diplômes, lieu, domaines, triée par pertinence ; filtres `serie` (règle `compatibiliteSerie` du moteur, champ `accesSerie`), `domaine`, `bourses`, `officielle` ; `GET /filiere/filtres` ; favoris `GET/PUT/DELETE /apprenant/:nip/favoris/:filiereId` (élève seul en écriture, 50 au plus). 14 domaines attribués aux 67 fiches (classement de l'équipe, à faire valider).
- Fait (front) : filtres portés par l'adresse, raccourci « Que faire avec mon bac D ? », « Et après ce bac ? » sur les fiches de bac, comparateur (3 formations, `/catalogue/comparer?ids=`), cœur « Mettre de côté » repris dans les vœux et le tableau de bord, partage WhatsApp / lien, impression (`print:hidden`).
- Piège corrigé : un `sr-only` dans un conteneur à défilement horizontal élargissait la page sur mobile (conteneur `relative`) ; les tests mobiles comparaient à `innerWidth`, qui s'élargit avec le contenu : durcis (390).
- Tests : `tests/api/catalogue.sh` 58/58, `tests/e2e/catalogue.mjs` 28/28 ; sécurité 37, parcours 38 + 10, conseiller 10 + 6, connexion 8 toujours au vert.

### 2026-09-13 23:16 — conseiller Gemini testé avec de vrais appels (fil principal)
- Fait : clé `GEMINI_API_KEY` dans `backend/.env` (non versionné ; à régénérer, elle a été collée dans la conversation). Modèle principal `gemini-3.6-flash`, secours `gemini-3.5-flash-lite` (`gemini-3.8-flash` : 20 requêtes/jour en offre gratuite ; `gemini-2.5-flash` retiré pour les nouveaux utilisateurs).
- Changements : le dossier pseudonymisé et les propositions du moteur sont joints à chaque question (outils `dossier_eleve` et `recommandations_eleve` retirés, ce qui économise un appel) ; en cas de 429/5xx, la question repart de zéro sur le modèle de secours ; une seule relance du SDK (5 par défaut).
- Vérifié : `CONSEILLER_TEST_LLM=1 bash tests/api/conseiller.sh` 18/18, `tests/e2e/conseiller.mjs` 6/6 avec réponse réelle. Qualité : médecine avec un bac D, DTM expliqué au parent en le vouvoyant, refus des questions politiques, élève harcelé orienté vers un adulte ; ni nom ni NIP dans les réponses.
- À savoir : ~2 000 à 3 000 jetons en entrée par appel ; le cache implicite de Gemini ne s'est pas déclenché (`cache=0`).

### 2026-09-13 21:33 — conseiller : passage de Claude à Gemini (fil principal)
- Décision (utilisateur) : Gemini, offre gratuite, à la place de Claude pour le prototype.
- Fait : SDK `@google/genai` 2.22 (`gemini-3.8-flash`, `models.generateContent` + déclarations de fonctions en schémas JSON) ; SDK Anthropic désinstallé. Outils, pseudonymisation, consignes, limites et conversations inchangés. Clé `GEMINI_API_KEY` ; une clé invalide renvoie 400 chez Google (traitée comme « non configuré »).
- Attention : dans l'offre gratuite, Google peut utiliser les échanges pour améliorer ses produits (page officielle des tarifs) → données de démonstration uniquement. En production : offre payante (0,75 $ / 3,75 $ par million de jetons jusqu'au 31/12/2026) ou modèle hébergé au Bénin.
- Tests : 37 sécurité + 38 parcours + 10 conseiller (API) et 6 conseiller (navigateur) au vert, **sans clé** : réponses réelles de Gemini pas encore testées.

### 2026-09-13 19:19 — conseiller pédagogique, prototype du niveau B (fil principal)
- Décision (utilisateur) : niveau B, « le moteur propose, le conseiller explique ». Reste à faire confirmer par le client (SPEC §7, point 5), avec la décision d'hébergement des données envoyées au modèle.
- Fait (backend) : Claude via `@anthropic-ai/sdk` 0.125 (`claude-opus-5`, effort `medium`, repli serveur `fallbacks: "default"`) ; boucle d'outils bornée à 6 appels : `rechercher_filieres`, `fiche_filiere`, `dossier_eleve` (pseudonymisé), `recommandations_eleve`, `evaluer_filiere` (nouveau `OrientationService.evaluerFiliere`) ; cache sur consignes + outils ; une conversation par session ; réservé aux élèves et parents, 10 messages/min par compte ; 503 explicite sans clé.
- Fait (front) : onglet « Conseiller » dans l'espace (suggestions, rendu sûr des réponses : seuls les liens internes sont cliquables) ; `/conseiller` redirige les élèves et parents.
- Choix d'architecture : outils sur nos services plutôt que LangChain + base vectorielle (ARCHITECTURE §2.4 mis à jour) ; la recherche documentaire viendra avec le guide numérique.
- Tests : `tests/api/conseiller.sh` (10) et `tests/e2e/conseiller.mjs` (6) ; ensemble 85 API + 24 navigateur au vert, **sans clé** : les appels réels au modèle n'ont pas encore été testés.

### 2026-09-13 18:27 — documentation et cahier des charges (fil principal)
- Fait : README racine (présentation, état d'avancement, architecture, démarrage, comptes de démo, tests, dépannage) et README détaillés `backend/` (configuration, API avec droits d'accès, moteur, migrations), `frontend/` (pages, authentification client, DSBJ et accessibilité), `mobile/` (projet à initialiser, plan Flutter).
- Fait : cahier des charges de présentation `docs/Cahier_des_charges_Mon_Orientation_v1.0.docx` + `.pdf` (13 p. A4), tiré de la note de cadrage et de SPEC.md, **sans aucune mention de l'avancement** (l'utilisateur n'a pas encore annoncé le projet au client) ; nom du prestataire à compléter (surligné). Régénérable avec `docs/outils/generer_cahier_des_charges.py` (écrase les retouches faites dans Word).
- Divers : `backend/setup.sh` passe à `prisma migrate deploy` ; `frontend/.env.example` ajouté.
- Suite : non commité — commit des docs quand l'utilisateur le demande.

### 2026-09-13 16:19 — parcours élève (fil principal)
- Fait (backend) : `Apprenant.palier/serie` ; un jeu de vœux par classe ; `POST /apprenant/:nip/preferences` (élève) et `/preferences/validation` (parent), validation annulée si les vœux changent ; le profil renvoie un bilan des notes. Moteur v2 : filières selon la classe et la série admise, matières clés 60 pts, vœux 30/20/10, seuils publiés, insertion si connue, 2 pistes max par famille, chaque critère expliqué (profils dans `orientation/profils-filieres.ts`, à valider par la DGES).
- Fait (front) : espace apprenant (tableau de bord, notes, vœux en 3 étapes sauvegardés à chaque étape, recommandations expliquées), vue parent avec validation, ocre foncé pour un contraste AA.
- Démo : `npm run prisma:seed:demo` (Fatou 3e, Koffi Tle D, Adama 4e sans compte, parent Moussa, DGES — mot de passe `Demo2026!`) ; remise à zéro : `tests/reinitialiser-demo.sh`.
- Tests : dossier `tests/` — 75 vérifications API + 18 navigateur, toutes au vert.
- Limite : moteur peu discriminant (nombreuses égalités, ex. 5 pistes à 53/100 pour Fatou) tant que les profils matières ne sont pas affinés.

### 2026-09-13 15:47 — sécurité et connexion (fil principal)
- Fait (backend) : `AccesApprenantGuard` (élève = son dossier, parent = enfants rattachés, admin) sur apprenant/orientation/conseiller ; `RolesGuard` (stats = DGES/ADMIN) ; faille `explain` corrigée ; `GET /auth/moi` ; déconnexion authentifiée ; refresh réparé (session = durée du refresh, rotation, `jti`) ; inscription élève = NIP + date de naissance rattachée au dossier ; bug d'inscription parent corrigé ; `JWT_SECRET` obligatoire ; helmet ; 5 essais/min par (IP, identifiant).
- Fait (front) : connexion et inscription réelles, session restaurée, rafraîchissement automatique du jeton, pages protégées (`RequireAuth`), en-tête selon le rôle.
- Vérifié : 37 tests API + 8 tests navigateur (Chrome headless piloté en CDP).
- Pièges : `start.sh` laissait un `node dist/main` orphelin sur :8080 (corrigé par `kill 0`) ; `nest --watch` ne relance pas son serveur sur un simple `touch`.
- Suite : bloc 2.

### 2026-09-13 13:42 — référentiel filières (fil principal)
- Fait : référentiel de 67 filières réelles et sourcées (`backend/prisma/data/referentiel-filieres.ts`) — 13 séries du bac + EA, 5 DT, 9 DTM LTP, 2 EFMS, 10 DTM LTA + DEAT, 6 écoles des métiers, 20 filières universitaires (UAC, INSTI, ENSET, IMSP). Chaque entrée cite ses sources (officielle ou non) ; aucun taux d'insertion (pas de donnée publique). Les 10 filières fictives sont supprimées par le seed.
- Schéma : `Filiere` + `code` (unique, clé d'upsert), `niveauAcces` (APRES_BEPC / APRES_BAC), `seriesAdmises`, `ouSeFormer`, `sources` ; `bourses` nullable — migration `20260913133911_referentiel_filieres`.
- API `/api/filiere` : filtre `niveau`, recherche sur `code`, validation type/niveau (400), `limit` ≤ 100. Front : `/catalogue` branché sur l'API, nouvelle fiche `/catalogue/[id]` (sources + avertissement si non officiel).
- Pièges : `prisma migrate dev` refuse le shell non interactif → `migrate diff --script` + `migrate deploy`. Ne pas lancer `next build` pendant que `start.sh` tourne (`.next` partagé → le `next dev` casse ; le relancer).
- Suite : faire valider le référentiel par le MESTFP / MESRS.

### 2026-09-13 13:10 — reprise (fil principal)
- Fait : cause du `ERR_CONNECTION_REFUSED` sur :3000 corrigée — binaire `@next/swc-linux-x64-gnu` tronqué (2,3 Mo au lieu de 131, npm install interrompu) → SIGBUS, `next dev` sortait en silence code 0 ; réinstallé. `tailwind.config.js` (contenait du TS) remis en `.ts`. `next build` + 7 pages OK, API + login admin OK.
- Sécurité : l'inscription publique acceptait `role: ADMIN` → `RegisterDto` limité à APPRENANT/PARENT (vérifié : 400).
- Données : seed non idempotent (30 filières = 10 × 3) → `prisma/seed.ts` corrigé, doublons supprimés en base locale.
- TASKS.md réaligné sur le code : repassés `in_progress` 1.2 (pas de MinIO, Dockerfiles absents), 1.5 (mobile = pubspec seul), 2.5 (pas de route de saisie), 2.10 (aucun contrôle de rôle), 3.2/3.4/3.5/6.3 (maquettes statiques sans appel API).
- Suite : voir "Prochaine action recommandée".

### 2026-09-11 11:00 — développement
- Fait : Setup complet backend + frontend
- Backend : NestJS, Prisma (schema complet), Auth JWT, API (apprenant, filiere, orientation, conseiller, stats)
- Frontend : Next.js 14, pages (accueil, catalogue, conseiller IA, espace apprenant, stats, connexion, inscription)
- Docker : docker-compose.yml (PostgreSQL, Redis, MinIO) + docker-compose.dev.yml
- Design : DSBJ intégré (palette, Montserrat, composants custom)
- Suite : installer les dépendances, lancer le dev, Flutter mobile

### 2026-09-11 10:45 — design
- Fait : DESIGN.md complet — 10 sections (personas, parcours, pages, DSBJ, responsive, accessibilité, animations, patterns UX, specs mobile/PWA)
- Fichiers : `DESIGN.md`
- 5 personas definis : élève 4e, élève 3e, parent non lettré, conseillère d'orientation, directeur DGES
- 4 parcours utilisateurs cartographiés
- Design system adapté du DSBJ officiel (palette, typo Montserrat, composants .bj-*)
- Suite : validation utilisateur, puis développement

### 2026-09-11 10:30 — architecture
- Fait : ARCHITECTURE.md (stack, modèle de données, API, sécurité, hors-ligne) et TASKS.md (55 tâches, 8 phases, 7 rôles)
- Fichiers : `ARCHITECTURE.md`, `TASKS.md`
- Stack validée : Next.js (web), Flutter (mobile), NestJS (backend), PostgreSQL, Redis, pgvector
- MVP = 32 tâches P0, fin octobre 2026
- Suite : validation utilisateur, puis DESIGN.md

### 2026-09-11 10:15 — formalisation
- Fait : Rédaction de SPEC.md — cahier des charges complet (11 sections, 8 composantes fonctionnelles)
- Fichiers : `SPEC.md`
- Décisions : MVP fin octobre 2026, Web + Mobile Flutter, design conforme DSBJ, hors-ligne partiel
- Points à arbitrer laissés ouverts : séance en 1re, saisie en 3e, périmètre IA, langues prioritaires
- Suite : validation utilisateur de SPEC.md, puis ARCHITECTURE.md et TASKS.md

### 2026-09-11 10:00 — cadrage
- Fait : Cadrage initial du projet "Mon Orientation" — plateforme nationale d'orientation scolaire pour le MESTFP (Bénin)
- Fichiers : `Note_cadrage_plateforme_orientation.docx` (brief client), `.gitignore`, `JOURNAL.md`
- Décisions : Web + Mobile (Flutter), MVP fin octobre 2026, hors-ligne partiel, design conforme DSBJ
- Suite : rédaction de SPEC.md, puis architecture
