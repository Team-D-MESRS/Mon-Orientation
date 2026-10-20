# Sources et constats initiaux — chantier Admin/DGES

- Dépôt : https://github.com/Team-D-MESRS/Mon-Orientation
- Branche consultée : `main`
- Commit de référence consulté : `4cffc69` (`docs(journal): fusion avec orientation-new-version/, redéploiement Railway/Vercel`)

## État constaté avant le chantier

- Rôles applicatifs définis dans `backend/prisma/schema.prisma` : `APPRENANT`, `PARENT`, `ETABLISSEMENT`, `DGES`, `ADMIN`.
- Connexion des élèves et parents via EducMaster ; connexion interne distincte pour `ADMIN`, `DGES`, `ETABLISSEMENT`.
- L’accès Établissement est expressément hors périmètre de cette évolution ; la gestion des fiches d’établissements reste dans le périmètre éditorial de l’Admin.
- La console `frontend/src/app/admin/page.tsx` est principalement en lecture seule.
- Aucun contrôleur CRUD catalogue/admin n’était présent ; `FiliereController` exposait essentiellement des routes de lecture.
- `StatsService` fournissait surtout des totaux, une répartition par type et des comptes par département.
- Le modèle possède déjà des données d’orientation (découvertes, recommandations, favoris, préférences) pouvant alimenter des analyses agrégées.
- Les pages d’accueil, FAQ et guide sont actuellement définies dans le frontend ; leur édition depuis le code doit être remplacée progressivement par le CMS.

Les exports et tableaux de bord doivent rester agrégés : aucune extraction nominative d’élève ou de contenu de conversation n’est destinée à la DGES.
