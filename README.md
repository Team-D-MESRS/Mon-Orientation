# Template équipe projet

Template à copier dans chaque nouveau projet client (web et/ou mobile). Contient une équipe de 10 agents IA par rôle, prête à l'emploi, et un skill qui orchestre le pipeline complet du brief client au code livré.

## Utilisation

1. Copie tout le dossier `.claude/`, ainsi que `CLAUDE.md` (et ce README si utile), dans le repo du nouveau projet client.
2. Ouvre une session Claude Code dans ce repo.
3. Lance `/lancer-projet` pour démarrer le pipeline, ou invoque directement un agent si tu n'as besoin que d'une étape précise (ex : "utilise l'agent architecte pour revoir la stack").

## L'équipe (`.claude/agents/`)

| Agent | Rôle | Quand l'utiliser |
|---|---|---|
| `product-owner` | Cadrage, cahier des charges | Début de projet, ou évolution de la demande client |
| `architecte` | Stack technique, découpe du travail | Après le cahier des charges |
| `ui-ux-designer` | Wireframes, design system | Après l'architecture, avant/pendant le dev |
| `backend-dev` | API, logique métier, base de données | Implémentation des tâches backend |
| `frontend-dev` | Interface web | Implémentation des tâches frontend web |
| `mobile-dev` | Interface mobile (iOS/Android) | Implémentation des tâches mobiles |
| `qa-reviewer` | Revue de code, tests, détection de bugs | Après chaque lot de tâches terminé |
| `devops` | CI/CD, déploiement, monitoring | Dès qu'il y a du code à déployer |
| `technical-writer` | Documentation technique + guide client | Fin de pipeline, une fois le projet livrable |
| `chef-de-projet` | Suivi, priorisation, risques, chiffrage, communication client | À tout moment, en dehors du pipeline séquentiel |

## Le pipeline (`.claude/skills/lancer-projet/`)

Le skill `/lancer-projet` fait dialoguer les agents via des fichiers partagés à la racine du projet plutôt qu'en contexte éphémère :

```
SPEC.md          cahier des charges          (product-owner)
ARCHITECTURE.md  stack + découpe technique   (architecte)
DESIGN.md        parcours UX + design system (ui-ux-designer)
TASKS.md         tâches par rôle + statut    (architecte, mis à jour par tous)
DEPLOY.md        process de déploiement      (devops)
README.md        doc technique               (technical-writer)
GUIDE-CLIENT.md  guide de prise en main      (technical-writer)
JOURNAL.md       état actuel + historique    (tous les agents, format défini dans CLAUDE.md)
```

Séquence : cadrage (conversation) → SPEC.md → ARCHITECTURE.md + TASKS.md → DESIGN.md → développement (parallèle quand les tâches sont indépendantes) → revue QA → déploiement → documentation. Le `chef-de-projet` peut être sollicité à tout moment en dehors de cette séquence.

## Checklists qualité intégrées

Plutôt que des agents dédiés pour chaque préoccupation transverse (SEO, sécurité, perf, accessibilité...), ces points sont des checklists intégrées dans le rôle qui les possède réellement, et vérifiées une dernière fois par `qa-reviewer` avant livraison :

- **SEO/finitions** (meta title/description, alt, robots.txt, 404 personnalisée, FAQ, CTA mobile) → `frontend-dev`
- **Sécurité** (secrets, validation des entrées, CORS, rate limiting, erreurs génériques, logs propres, webhooks signés) → `backend-dev`
- **Déploiement sûr** (HTTPS forcé, `.gitignore` audité, pas de secret commité) → `devops`
- **Performance/charge** (test avec plusieurs utilisateurs simulés) → vérifié par `qa-reviewer`, uniquement si le projet anticipe un trafic significatif (voir SPEC.md)

## Continuité entre sessions et comptes

Si tu travailles sur un projet depuis plusieurs comptes Claude (bascule en cas de limite d'usage atteinte), chaque nouvelle session doit pouvoir reprendre le travail sans que tu aies à réexpliquer où en est le projet.

Le mécanisme : `CLAUDE.md` (à la racine de chaque projet client, copié depuis ce template) est chargé automatiquement par Claude Code dans le contexte de toute session — fil principal comme agents — dès son premier tour, peu importe le compte connecté. Il instruit toute session de lire `JOURNAL.md` en priorité (section "État actuel") avant de redemander le contexte, et de le tenir à jour après toute évolution notable.

Pas de nouvel agent dédié pour ça : chaque agent de l'équipe journalise déjà son propre travail (même discipline que pour `TASKS.md`), et `chef-de-projet` audite/comble les trous et produit une synthèse de reprise sur demande. `CLAUDE.md` couvre aussi le cas où tu travailles en ad hoc, en conversation directe, sans passer par `/lancer-projet` ni par un agent explicite — c'est le seul mécanisme du template qui s'applique sans action de ta part.

## Faire évoluer le template

Ce dossier est la source de vérité de l'équipe : si tu ajustes un rôle après l'avoir utilisé sur un projet client (prompt trop vague, tools manquants...), reporte le changement ici pour que le prochain projet en bénéficie aussi.
