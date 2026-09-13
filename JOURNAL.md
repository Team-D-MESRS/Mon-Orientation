# Journal de bord

> Permet à toute nouvelle session (même depuis un autre compte) de reprendre le
> travail sans relire l'historique de conversation. Lis "État actuel" d'abord,
> puis les entrées récentes de "Historique" si besoin.

## État actuel

- **Étape du pipeline** : développement MVP
- **En cours** : bloc 2 — parcours élève (données de démo, API de saisie des préférences, moteur d'orientation v2, écrans espace apprenant / préférences / recommandations)
- **Bloqué / en attente de** : validation du référentiel filières par le client ; accès API EducMaster (2.1) ; arbitrages SPEC §7 (saisie des vœux élève/parent, périmètre IA, langues)
- **Prochaine action recommandée** : terminer le bloc 2 ; ensuite accès du rôle ÉTABLISSEMENT (2.10), relation Filière ↔ Établissement N-N (architecte), projet Flutter
- **Dernière mise à jour** : 2026-09-13 15:47 — sécurité et connexion (fil principal)

## Historique

*(plus récent en haut)*

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
