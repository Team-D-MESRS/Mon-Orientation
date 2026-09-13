# CLAUDE.md

## Contexte

Ce projet est développé avec Claude Code, potentiellement depuis plusieurs comptes Claude différents (bascule en cas de limite d'usage atteinte). Toute nouvelle session — quel que soit le compte connecté — doit pouvoir reprendre le travail immédiatement.

## À faire en priorité au démarrage de toute session

1. Lis `JOURNAL.md` à la racine du projet (s'il existe), en particulier sa section "État actuel" tout en haut. C'est la source de vérité sur où en est le projet, ce qui est en cours, et la prochaine action — plus rapide et plus fiable que de relire l'historique de conversation.
2. Si `JOURNAL.md` n'existe pas encore, le projet vient de démarrer : rien à faire ici, il sera créé à la première mise à jour (voir plus bas).
3. Pour le détail, consulte selon le besoin : `SPEC.md`, `ARCHITECTURE.md`, `TASKS.md`, `DESIGN.md`, `DEPLOY.md`.

## TASKS.md vs JOURNAL.md — ne pas confondre

- `TASKS.md` = tableau de bord des tâches (quoi, par qui, quel statut).
- `JOURNAL.md` = journal de bord narratif : ce qui vient de se passer, l'état actuel en langage clair, la prochaine action recommandée — pensé pour qu'une nouvelle session comprenne "où on en est" en 30 secondes, sans lire tout TASKS.md ni l'historique de conversation.

## Règle : tenir JOURNAL.md à jour

Après toute évolution notable du projet — une tâche terminée, une fonctionnalité ajoutée, une décision d'architecture ou de scope, un blocage rencontré ou levé, ou la fin d'une session de travail — mets à jour `JOURNAL.md` :

- que tu sois un agent de `.claude/agents/` qui vient de terminer son travail,
- ou que tu travailles en ad hoc, directement dans le fil principal, sans passer par un agent ni par le skill `/lancer-projet`.

Inutile de journaliser chaque micro-modification. Journalise au niveau d'une étape significative. Si tu hésites : "est-ce que quelqu'un qui reprend le projet à froid a besoin de savoir ça pour ne pas reproduire du travail ou casser quelque chose ?"

## Format de JOURNAL.md

S'il n'existe pas encore, crée-le à la racine avec cette structure :

```markdown
# Journal de bord

> Permet à toute nouvelle session (même depuis un autre compte) de reprendre le
> travail sans relire l'historique de conversation. Lis "État actuel" d'abord,
> puis les entrées récentes de "Historique" si besoin.

## État actuel

- **Étape du pipeline** : développement (backend en cours)
- **En cours** : authentification (tâche TASKS.md #4)
- **Bloqué / en attente de** : rien actuellement
- **Prochaine action recommandée** : une fois l'auth backend terminée, lancer
  l'intégration frontend du login
- **Dernière mise à jour** : 2026-09-04 14:32 — backend-dev

## Historique

*(plus récent en haut)*

### 2026-09-04 14:32 — backend-dev
- Fait : endpoint `POST /auth/login` avec rate limiting et validation
- Fichiers : `src/routes/auth.ts`, `src/middleware/rateLimit.ts`
- TASKS.md : tâche "Auth backend" passée à "fait"
- Suite : frontend-dev peut intégrer le formulaire de login

### 2026-09-03 09:10 — architecte
- Fait : ARCHITECTURE.md et TASKS.md initiaux (stack : Next.js + Supabase)
- Décision : pas de mode hors-ligne en V1 (confirmé avec l'utilisateur)
- Suite : ui-ux-designer peut démarrer DESIGN.md
```

Règles d'écriture :
- **"État actuel" est remplacé, pas empilé** — instantané toujours à jour.
- **"Historique" est un ajout en tête de liste**, jamais réécrit — c'est la trace.
- Une entrée reste courte (3-6 lignes) : Fait / Fichiers ou décision / Suite. Le détail ligne à ligne existe déjà dans les commits git.
- Si le fichier dépasse ~50 entrées ou à un jalon (mise en prod), déplace les entrées anciennes vers `JOURNAL-ARCHIVE.md` et laisse un lien en bas.

## Plusieurs comptes Claude

Le mécanisme ci-dessus fonctionne identiquement pour toute nouvelle session, peu importe le compte. Si une session sent qu'elle touche à sa limite (quota, longueur), mets à jour JOURNAL.md avant de t'arrêter plutôt que de compter sur la session suivante pour reconstituer l'état à partir du code seul.

## Git

`CLAUDE.md` et `JOURNAL.md` sont commités normalement (comme `SPEC.md`, `TASKS.md`...) — contrairement à `.claude/`, qui reste exclu du dépôt client.
