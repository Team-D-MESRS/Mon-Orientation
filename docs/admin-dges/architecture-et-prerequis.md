# Console Admin et observatoire DGES

## Périmètre livré

Le chantier sépare les rôles institutionnels dans deux espaces, sans ajouter le profil **Établissement** au périmètre fonctionnel :

- **ADMIN** : `/admin` et `/admin/gestion` — gestion du catalogue de filières, des établissements de formation, des pages éditoriales autorisées, des brouillons, de la publication, de l’historique et de la restauration sous forme de brouillon.
- **DGES** : `/stats` — observatoire agrégé avec période et filtre territorial, qualité du catalogue, parcours d’orientation, événements consentis et exports CSV/XLSX.
- Après connexion, ADMIN arrive dans la console Admin ; DGES arrive dans l’observatoire. Les liens de navigation sont séparés.

L’administration utilise le workflow **brouillon → aperçu → publication explicite**. Le retrait d’une fiche est une désactivation logique (filière masquée ou établissement inactif), pas une suppression destructive. L’historique est conservé et une restauration crée un nouveau brouillon.

## Contenus actuellement administrables

- Fiches filière : champs de catalogue disponibles dans le schéma, sources, visuels, vidéo, lieux/offres associés et archivage logique.
- Établissements de formation : référentiel, implantation, informations pratiques, offres et archivage logique.
- Pages statiques branchées au CMS : accueil, FAQ, guide et contact. Les brouillons ne sont jamais servis aux visiteurs. Le contenu est rendu en texte, pas en HTML exécutable ; les liens doivent être internes ou HTTPS.
- Médias : choix parmi les visuels livrés, adresse d’un média déjà hébergé ou téléversement JPEG/PNG/WebP (8 Mo maximum) vers MinIO/S3 compatible.

Le CMS ne permet pas de créer automatiquement une route Next.js : son édition est réservée aux pages déclarées ci-dessus. Les documents juridiques/confidentialité restent statiques pour éviter de publier par inadvertance des informations réglementaires non validées.

## Migration et déploiement

La migration non appliquée est `backend/prisma/migrations/20261009023000_admin_cms_analytics/migration.sql`. Elle ajoute les brouillons, l’historique, les pages CMS, les compteurs d’usage journaliers et le champ `etablissements.actif`.

Avant déploiement :

1. Sauvegarder la base de données.
2. Renseigner les secrets de production (notamment `JWT_SECRET`, `SEED_ADMIN_PASSWORD` et `GUIDO_API_KEY`) dans le gestionnaire de secrets, pas dans Git.
3. Pour l’upload média, provisionner un bucket MinIO/S3 dédié, renseigner `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` et `MINIO_PUBLIC_URL` dans le backend. Le compte doit pouvoir créer un bucket ou accéder au bucket déjà créé et définir la politique qui autorise la lecture publique **uniquement** de `uploads/filieres/*`. L’URL publique doit être en HTTPS en production et pointer vers le bucket selon le format path-style `/bucket/key`.
4. Déployer le schéma avec `npx prisma migrate deploy` depuis le backend.
5. Redéployer backend et frontend ensemble, puis vérifier les parcours Admin/DGES, les gardes, l’upload, les exports et l’API externe Guido.

Aucune migration n’a été appliquée à une base distante depuis ce chantier. Aucun secret backend réel n’a été fourni dans cette session ; les tests de chat en production et la confirmation des permissions MinIO restent des étapes d’exploitation.

## Mesure d’audience et prudence d’interprétation

La collecte ne démarre qu’après acceptation explicite. Le visiteur peut modifier son choix sur `/donnees-personnelles`. Trois catégories seulement sont prévues : recherche catalogue (sans la requête), consultation de fiche et utilisation de Guido (sans message ni NIP).

Le backend incrémente un **compteur agrégé quotidien** par jour UTC, type et dimension contrôlée. Il ne stocke pas une ligne par action, un identifiant d’événement, un identifiant de visiteur, un compte, un NIP, une IP, une requête ou un message. Après le retrait du consentement, les nouvelles incrémentations cessent ; les compteurs déjà agrégés ne permettent pas d’isoler une action individuelle. Les journaux techniques de l’hébergement sont distincts et doivent être vérifiés avant la production.

Les indicateurs décrivent les dossiers actuellement présents dans Mon Orientation, pas l’effectif scolaire national. Le stock d’apprenants est le nombre de dossiers d’apprenant, qu’ils disposent ou non d’un compte connecté ; « nouveaux dossiers » utilise `Apprenant.createdAt`. Les paliers, séries, établissements, filières, offres et parents actifs sont des stocks actuels. Les questionnaires saisis, recommandations générées, préférences créées, favoris enregistrés et usages anonymes utilisent leur date d’activité. Le compteur « apprenants avec découverte » déduplique les dossiers ayant au moins une découverte, tous temps confondus ; le taux correspondant divise ce nombre par le stock actuel de dossiers apprenants. Les préférences validées comptent les préférences créées pendant la période qui sont marquées validées, et non les dates de validation. Les usages anonymes ne sont pas ventilés par département. Le filtre départemental s’applique aux apprenants et aux comptes parents liés aux apprenants du département, ainsi qu’aux établissements/offres actifs du territoire.

**Ne pas présenter les chiffres comme une statistique nationale** tant que l’intégration et la qualité d’EDUCMASTER ou d’une source officielle n’ont pas été établies, les dénominateurs documentés et les règles de couverture approuvées par la DGES.

## Limites connues

- Les pages CMS sont des blocs de texte simples, pas un constructeur visuel de toutes les sections du site.
- Le téléversement dépend du stockage objet et de son URL HTTPS ; il n’est pas opérationnel tant que les variables `MINIO_*` ne sont pas configurées.
- Il n’existe pas encore d’interface pour créer des rôles, accorder des accès, gérer la synchronisation EducMaster ou modifier les identités/comptes.
- Les journaux techniques HTTP/MinIO et la politique de conservation doivent être validés côté exploitation et responsable de la protection des données.
- Les données du seed/demo ne constituent pas une source officielle et les indicateurs s’adaptent à leur complétude.
