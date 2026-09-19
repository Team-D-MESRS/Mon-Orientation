# TASKS.md — Découpage des tâches

## Mon Orientation — Plateforme nationale d'orientation scolaire

| Champ | Valeur |
|---|---|
| **Date** | 11 septembre 2026 |
| **Référence** | SPEC.md v1, ARCHITECTURE.md v1 |
| **MVP cible** | Fin octobre 2026 |

---

## Légende

- **Statut** : `pending` | `in_progress` | `done` | `blocked`
- **Priorité** : `P0` (critique MVP) | `P1` (important) | `P2` (souhaitable)
- **Rôle** : `architecte` | `backend-dev` | `frontend-dev` | `ai-dev` | `devops` | `qa-reviewer`

---

## Phase 1 — Setup et fondations (Sem 1)

| # | Tâche | Rôle | Priorité | Statut | Dépendances |
|---|---|---|---|---|---|
| 1.1 | Initialiser le repo Git, `.gitignore`, structure de dossiers | architecte | P0 | `done` | — |
| 1.2 | Setup Docker Compose (PostgreSQL) | devops | P0 | `done` | 1.1 |
| 1.3 | Setup NestJS (backend) — structure modulaire, Prisma, Swagger | backend-dev | P0 | `done` | 1.2 |
| 1.4 | Setup Next.js (frontend web) — App Router, DSBJ, Tailwind | frontend-dev | P0 | `done` | 1.1 |
| 1.6 | Schéma Prisma initial (utilisateurs, apprenants, établissements) | backend-dev | P0 | `done` | 1.3 |
| 1.7 | Système d'authentification (JWT) — remplacé le 16/09 par l'identification EducMaster (NIP ou numéro EducMaster, plus d'inscription ni de mot de passe choisi par l'élève, voir JOURNAL.md) | backend-dev | P0 | `done` | 1.6 |
| 1.8 | CI/CD GitHub Actions (lint, test, build, Docker) | devops | P1 | `pending` | 1.1 |

---

## Phase 2 — Backend core (Sem 2-3)

| # | Tâche | Rôle | Priorité | Statut | Dépendances |
|---|---|---|---|---|---|
| 2.1 | API EducMaster — client HTTP, synchronisation des données | backend-dev | P0 | `blocked` (adaptateur prêt en mode `fictif`, accès réel à l'API en attente — seul verrou avant la mise en ligne, voir JOURNAL.md) | 1.3 |
| 2.2 | Schéma DB complet (notes, filières, préférences, recommandations, conversations) | backend-dev | P0 | `done` | 1.6 |
| 2.3 | CRUD Catalogue de filières (référentiel national) | backend-dev | P0 | `done` | 2.2 |
| 2.4 | API Apprenant — profil, notes, parcours | backend-dev | P0 | `done` | 2.1, 2.2 |
| 2.5 | API Préférences — saisie, validation, historique | backend-dev | P0 | `done` | 2.2, 2.4 |
| 2.6 | Moteur d'orientation — algorithme de matching (notes + préférences) | backend-dev | P0 | `done` | 2.3, 2.4, 2.5 |
| 2.7 | API Recommandations — génération, explication, historique | backend-dev | P0 | `done` | 2.6 |
| 2.10 | Gestion des rôles et habilitations (apprenant, parent, etablissement, dges, admin) | backend-dev | P0 | `in_progress` | 1.7 |

*(2.8 « Cache Redis » et 2.9 « File d'attente BullMQ » retirées — décision du 17/09/2026 : ni l'un ni l'autre
n'a jamais été branché, dépendances désinstallées. La limitation des tentatives de connexion reste en mémoire
dans le process backend.)*

---

## Phase 3 — Frontend web (Sem 2-4)

| # | Tâche | Rôle | Priorité | Statut | Dépendances |
|---|---|---|---|---|---|
| 3.1 | Page d'accueil — hero, services, actualités (composants DSBJ) | frontend-dev | P0 | `done` | 1.4 |
| 3.2 | Page d'identification EducMaster (`/identification`, `/personnels`) — remplace l'ancienne page connexion/inscription NIP + mot de passe | frontend-dev | P0 | `done` | 1.4, 1.7 |
| 3.3 | Layout principal — header DSBJ, navigation, footer | frontend-dev | P0 | `done` | 1.4 |
| 3.4 | Espace apprenant — tableau de bord, profil, notes | frontend-dev | P0 | `done` | 2.4, 3.3 |
| 3.5 | Catalogue — recherche multicritère, fiches filières, comparaison | frontend-dev | P0 | `done` | 2.3, 3.3 |
| 3.6 | Saisie des préférences — formulaire orienté, validation parent | frontend-dev | P0 | `done` | 2.5, 3.4 |
| 3.7 | Recommandations — affichage, explication, sélection | frontend-dev | P0 | `done` | 2.7, 3.6 |
| 3.8 | Module d'information — contenus par palier, guides, vidéos | frontend-dev | P1 | `pending` | 3.3 |
| 3.9 | PWA — service worker, mode hors-ligne, cache contenus | frontend-dev | P1 | `pending` | 3.1, 3.5, 3.8 |
| 3.10 | Admin — première console de supervision catalogue, santé API et indicateurs | frontend-dev | P1 | `done` | 2.10, 2.3, 3.3 |

---

*(Phase 4 « Application mobile Flutter » retirée — décision du 17/09/2026 : pas de version mobile, web
uniquement, voir JOURNAL.md. Le dossier `mobile/` a été supprimé.)*

---

## Phase 5 — Intelligence Artificielle (Sem 4-6)

| # | Tâche | Rôle | Priorité | Statut | Dépendances |
|---|---|---|---|---|---|
| 5.1 | Architecture RAG — embeddings, vector store (pgvector) | ai-dev | P0 | `pending` | 2.3 |
| 5.2 | Conseiller IA (texte) — prompt system, mémoire conversationnelle | ai-dev | P0 | `in_progress` | 5.1, 2.4, 2.5 |
| 5.3 | Intégration vocale — connexion API « J'aime ma langue » (ASIN/IIDIA) | ai-dev | P2 | `pending` | 5.2 |
| 5.4 | Supervision humaine — modération des réponses, contrôle qualité | ai-dev | P1 | `pending` | 5.2 |
| 5.5 | Protection données — chiffrement conversations, anonymisation logs | ai-dev | P0 | `pending` | 5.2 |

---

## Phase 6 — Statistiques et pilotage (Sem 5-6)

| # | Tâche | Rôle | Priorité | Statut | Dépendances |
|---|---|---|---|---|---|
| 6.1 | API Stats nationales — indicateurs, flux, répartition | backend-dev | P1 | `done` | 2.2, 2.7 |
| 6.2 | API Stats par département | backend-dev | P1 | `done` | 6.1 |
| 6.3 | Dashboard web — indicateurs, répartition et filtres de base | frontend-dev | P1 | `done` | 6.1, 3.3 |
| 6.4 | Export rapports — PDF, Excel | backend-dev | P1 | `pending` | 6.1 |
| 6.5 | Cartographie — visualisation géographique par département | frontend-dev | P2 | `pending` | 6.2, 3.3 |

---

## Phase 7 — QA et optimisation (Sem 6-7)

| # | Tâche | Rôle | Priorité | Statut | Dépendances |
|---|---|---|---|---|---|
| 7.1 | Tests unitaires backend (couverture > 80%) | qa-reviewer | P0 | `in_progress` | 2.x |
| 7.2 | Tests unitaires frontend | qa-reviewer | P0 | `pending` | 3.x |
| 7.3 | Tests d'intégration API | qa-reviewer | P0 | `in_progress` | 2.x |
| 7.4 | Tests mobile (tests d'interface) | qa-reviewer | P1 | `pending` | 4.x |
| 7.5 | Audit sécurité —OWASP Top 10, injection, XSS | qa-reviewer | P0 | `pending` | 2.x |
| 7.6 | Performance — optimisation requêtes, cache, lazy loading | qa-reviewer | P1 | `in_progress` | 2.x, 3.x |
| 7.7 | Accessibilité — WCAG 2.1 AA, lecteurs d'écran, contraste | qa-reviewer | P1 | `in_progress` | 3.x |
| 7.8 | Tests charge — montée en charge simulée | qa-reviewer | P2 | `pending` | 2.x |

---

## Phase 8 — Déploiement et documentation (Sem 7-8)

| # | Tâche | Rôle | Priorité | Statut | Dépendances |
|---|---|---|---|---|---|
| 8.1 | Infra production — Docker Swarm/K8s, SSL, backups | devops | P0 | `pending` | 1.2 |
| 8.2 | Déploiement staging — tests en environnement réel | devops | P0 | `pending` | 8.1 |
| 8.3 | Déploiement production | devops | P0 | `pending` | 8.2 |
| 8.4 | Monitoring — Prometheus, Grafana, alertes | devops | P1 | `pending` | 8.1 |
| 8.5 | README.md technique — setup, architecture, API docs | architecte | P1 | `pending` | 8.3 |
| 8.6 | GUIDE-CLIENT.md — prise en main non technique | architecte | P1 | `pending` | 8.3 |
| 8.7 | Mise à jour JOURNAL.md — bilan de phase | architecte | P1 | `pending` | 8.3 |

---

## Résumé par rôle

| Rôle | Nb tâches P0 | Nb tâches P1 | Nb tâches P2 | Total |
|---|---|---|---|---|
| architecte | 2 | 2 | 0 | 4 |
| backend-dev | 9 | 4 | 0 | 13 |
| frontend-dev | 6 | 4 | 1 | 11 |
| ai-dev | 3 | 1 | 1 | 5 |
| devops | 3 | 2 | 0 | 5 |
| qa-reviewer | 4 | 3 | 1 | 8 |
| **Total** | **27** | **16** | **3** | **46** |

---

## MVP — Scope fin octobre 2026

Pour le MVP, se concentrer sur les tâches **P0** uniquement :

- Setup complet (1.1 → 1.8)
- Backend core : EducMaster, catalogue, moteur d'orientation, préférences
- Frontend web : accueil, identification EducMaster, espace apprenant, catalogue, préférences, recommandations
- IA : conseiller texte (pas encore vocal)
- Déploiement staging + production

Pas de version mobile (décision du 17/09/2026, voir JOURNAL.md) : le MVP est web uniquement.
