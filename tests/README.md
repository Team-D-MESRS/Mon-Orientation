# Tests de bout en bout

Scripts de vérification contre l'application **lancée en local** (`./start.sh`), sans dépendance à installer.

## Prérequis

1. `./start.sh` en cours (API sur :8080, front sur :3000, PostgreSQL dans le conteneur `mo-postgres`)
2. Données de démonstration : `cd backend && npm run prisma:seed:demo`
3. Pour les tests navigateur : Google Chrome (variable `CHROME` pour un autre chemin) et Node 22

## Lancer

```bash
bash tests/api/securite.sh          # droits d'accès, inscription, jetons, limitation des tentatives
bash tests/api/parcours-eleve.sh    # bilan des notes, moteur d'orientation, vœux, validation parent
node tests/e2e/connexion.mjs        # connexion, session, pages protégées, déconnexion, inscription
node tests/e2e/parcours-eleve.mjs   # parcours complet élève / parent / Terminale, captures ordinateur et mobile
bash tests/api/conseiller.sh        # conseiller : droits, validation, conversations, limitation (sans appel au modèle)
CONSEILLER_TEST_LLM=1 bash tests/api/conseiller.sh   # + appels réels au modèle (clé GEMINI_API_KEY requise, quota gratuit limité)
node tests/e2e/conseiller.mjs       # conseiller dans le navigateur (sans clé : message explicite ; avec clé : réponse)
bash tests/reinitialiser-demo.sh    # remet la démo à zéro (le test navigateur laisse des vœux validés)
```

Les captures d'écran sont écrites dans `tests/e2e/captures/` (non versionné). Variables utiles : `API_URL`, `FRONT_URL`, `PG_CONTAINER`, `CHROME`.

Les scripts d'API créent leurs propres données de test (préfixe `TEST-B1-`) ou réinitialisent les dossiers `DEMO-`, puis nettoient derrière eux.

## Comptes de démonstration (mot de passe `Demo2026!`)

| Profil | Identifiant | Remarque |
|---|---|---|
| Élève de 3e | `DEMO-3E-0001` (Fatou) | saisie des vœux |
| Élève de Terminale D | `DEMO-TLE-0001` (Koffi) | pistes du supérieur |
| Élève de 4e | `DEMO-4E-0001` (Adama) | sans compte : s'inscrire avec la date de naissance 2012-07-08 |
| Parent | `parent.demo@monorientation.bj` (Moussa) | valide les vœux de Fatou |
| DGES | `dges.demo@monorientation.bj` | statistiques |
