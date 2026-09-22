# Tests de bout en bout

Scripts de vérification contre l'application **lancée en local** (`./start.sh`), sans dépendance à installer.

## Prérequis

1. `./start.sh` en cours (API sur :8080, front sur :3000, PostgreSQL dans le conteneur `mo-postgres`)
2. Données de démonstration : `cd backend && npm run prisma:seed:demo`
3. Pour les tests navigateur : Google Chrome (variable `CHROME` pour un autre chemin) et Node 22
4. `responsive.mjs` et `connexion.mjs` se connectent aussi en tant qu'administrateur (`admin@monorientation.bj` / `admin123` en dev) : si ce compte n'existe pas encore dans la base, lancer aussi `cd backend && npm run prisma:seed` (upsert, sans danger à rejouer — recrée aussi tout le référentiel de filières si absent)

## Lancer

```bash
bash tests/api/securite.sh          # droits d'accès, identification EducMaster, jetons, limitation des tentatives
bash tests/api/parcours-eleve.sh    # bilan des notes, moteur d'orientation, vœux, validation parent
node tests/e2e/connexion.mjs        # identification, accès des personnels, session, pages protégées, déconnexion
node tests/e2e/parcours-eleve.mjs   # parcours complet élève / parent / Terminale, captures ordinateur et mobile
bash tests/api/conseiller.sh        # conseiller : droits, validation, conversations, limitation (sans appel au modèle)
CONSEILLER_TEST_LLM=1 bash tests/api/conseiller.sh   # + appels réels au modèle (clé GEMINI_API_KEY requise, quota gratuit limité)
node tests/e2e/conseiller.mjs       # conseiller dans le navigateur (sans clé : message explicite ; avec clé : réponse)
bash tests/api/catalogue.sh         # recherche sans accents, filtres, séries du bac, domaines, formations mises de côté
node tests/e2e/catalogue.mjs        # filtres, comparateur, « Et après ce bac ? », partage, impression, cœurs, mobile
node tests/e2e/pied-de-page.mjs     # pages d'information, liens du pied de page (aucun lien mort), pied de page en bas, 404
node tests/e2e/accueil.mjs          # accueil : contenus exacts, recherche, séries, domaines, animations au défilement (et réduites), boutons selon la connexion, mobile
node tests/e2e/responsive.mjs       # débordement horizontal (320 → 1024px), cibles tactiles, en-tête (rôle à 5 liens), menu mobile, orientation paysage — nécessite le compte admin (prisma:seed, pas seulement seed:demo)
bash tests/reinitialiser-demo.sh    # remet la démo à zéro : vœux, recommandations, conversations, formations mises de côté
```

Lancer `reinitialiser-demo.sh` avant `parcours-eleve.mjs` : ce test saisit les vœux de Fatou depuis l'étape 1. Les tests navigateur utilisent tous le port 9333 de Chrome : ils se lancent l'un après l'autre.

Les captures d'écran sont écrites dans `tests/e2e/captures/` (non versionné). Variables utiles : `API_URL`, `FRONT_URL`, `PG_CONTAINER`, `CHROME`, `ADMIN_PASSWORD` (compte admin du seed, `admin123` par défaut en développement).

Les scripts d'API créent leurs propres données de test (préfixe `TEST-B1-`) ou réinitialisent les dossiers `DEMO-`, puis nettoient derrière eux.

## Comptes de démonstration (mot de passe `Demo2026!`)

| Profil | Identifiant | Remarque |
|---|---|---|
| Élève de 3e | `DEMO-3E-0001` (Fatou) | test de découverte déjà rempli, vœux déjà saisis |
| Élève de Terminale D | `DEMO-TLE-0001` (Koffi) | test de découverte déjà rempli, pistes du supérieur |
| Élève de 3e, sans test | `DEMO-3E-0002` (Rachidath) | démo du mur et du test RIASEC pour la fiche unique d'inscription (3e) |
| Élève de Terminale E, sans test | `DEMO-TLE-0002` (Idrissa) | démo du mur et du test RIASEC pour les vœux du supérieur (Terminale) |
| Élève de 1re, sans test | `DEMO-1RE-0001` (Chimène) | sœur de Fatou (même parent) ; démo du mur en 1re, et côté parent du contraste avec un enfant déjà rempli |
| Élève de 4e, sans test | `DEMO-4E-0002` (Serge) | comme Adama, mais avec un compte déjà créé (connexion directe, sans le détour date de naissance) |
| Élève de 4e | `DEMO-4E-0001` (Adama) | sans compte : s'inscrire avec la date de naissance 2012-07-08 |
| Parent | `parent.demo@monorientation.bj` (Moussa) | valide les vœux de Fatou ; suit aussi Chimène (2e enfant, découverte non remplie) |
| DGES | `dges.demo@monorientation.bj` | statistiques |
