# Mon Orientation — Application mobile (Flutter)

Application Android et iOS de la plateforme nationale d'orientation scolaire. Elle doit offrir aux élèves et aux parents :

- le catalogue des filières ;
- l'espace personnel (notes, vœux, recommandations) ;
- le conseiller pédagogique, y compris **à l'oral**, pour les familles peu à l'aise avec l'écrit ;
- une consultation **hors-ligne** des contenus.

> **État : projet à initialiser.** Seul `pubspec.yaml` existe. Il n'y a encore ni code Dart ni dossiers de plateformes. L'application web et l'API sont, elles, opérationnelles : l'application mobile consommera la même API ([../backend/README.md](../backend/README.md)).

---

## Sommaire

1. [Périmètre prévu](#périmètre-prévu)
2. [Stack prévue](#stack-prévue)
3. [Initialiser le projet](#initialiser-le-projet)
4. [Architecture proposée](#architecture-proposée)
5. [Connexion à l'API](#connexion-à-lapi)
6. [Design (DSBJ)](#design-dsbj)
7. [Hors-ligne](#hors-ligne)
8. [Conseiller vocal](#conseiller-vocal)
9. [Feuille de route](#feuille-de-route)
10. [Points à trancher](#points-à-trancher)

---

## Périmètre prévu

Les écrans reprennent ceux du web (voir [../DESIGN.md](../DESIGN.md) §9), autour d'une **barre de navigation à 4 onglets** :

| Onglet | Contenu |
|---|---|
| Accueil | Étape d'orientation en cours, raccourcis, contenus d'information par classe |
| Catalogue | Recherche et filtres (niveau, type), fiche filière avec ses sources |
| Mon espace | Profil, notes, vœux (3e / Terminale), recommandations expliquées ; vue parent avec validation des vœux |
| Conseiller | Conversation écrite et vocale ; badge en cas de nouveau message |

Les règles métier sont celles de l'API. En particulier, le mobile ne recalcule rien : il affiche les scores et les critères du moteur.

---

## Stack prévue

Déclarée dans `pubspec.yaml` (Dart ≥ 3.0) :

| Paquet | Usage |
|---|---|
| `flutter_riverpod` | État de l'application |
| `go_router` | Navigation, liens profonds, redirection si non connecté |
| `http` | Appels à l'API |
| `hive`, `hive_flutter` | Cache local (catalogue, profil, recommandations) |
| `shared_preferences` | Préférences simples |
| `connectivity_plus` | Détection du réseau, bascule en mode hors-ligne |
| `speech_to_text`, `flutter_tts` | Conseiller vocal |
| `intl` | Dates et nombres en français (`fr_FR`) |
| `lucide_icons` | Mêmes icônes que le web |

À ajouter à l'initialisation :

- `flutter_secure_storage` : **stockage chiffré des jetons**, à ne jamais mettre dans `shared_preferences` ;
- éventuellement `dio` : l'ARCHITECTURE prévoit Dio + Retrofit, alors que le `pubspec` déclare `http` (voir les points à trancher).

---

## Initialiser le projet

`pubspec.yaml` déclare les dossiers d'assets `assets/icons/` et `assets/images/`, qui doivent exister. Comme `flutter create` peut réécrire `pubspec.yaml`, on le sauvegarde d'abord :

```bash
cd mobile
cp pubspec.yaml /tmp/pubspec.mon_orientation.yaml
flutter create --project-name mon_orientation --org bj.monorientation --platforms android,ios .
cp /tmp/pubspec.mon_orientation.yaml pubspec.yaml
mkdir -p assets/icons assets/images
flutter pub add flutter_secure_storage
flutter pub get
flutter run                       # émulateur ou appareil connecté
```

L'identifiant d'application (`--org`) est provisoire : l'identifiant définitif est à fixer avec le ministère, avant toute publication sur les stores.

Commandes courantes :

| Commande | Effet |
|---|---|
| `flutter run` | Lancer en développement (rechargement à chaud avec `r`) |
| `flutter analyze` | Analyse statique (`flutter_lints`) |
| `flutter test` | Tests unitaires et de widgets |
| `flutter build apk --release` / `flutter build ipa` | Builds de publication |

---

## Architecture proposée

```
lib/
├── main.dart                     ProviderScope, MaterialApp.router, locale fr
├── app/
│   ├── router.dart               go_router : 4 onglets (StatefulShellRoute), garde d'authentification
│   └── theme.dart                ThemeData Material 3 aux couleurs DSBJ, police Montserrat
├── core/
│   ├── api/                      client HTTP, intercepteur de jeton, rafraîchissement unique, erreurs
│   ├── auth/                     session (secure storage), fournisseur de l'utilisateur connecté
│   ├── cache/                    boîtes Hive, politique « cache puis réseau »
│   └── connectivite.dart         état du réseau (connectivity_plus)
└── features/
    ├── accueil/
    ├── catalogue/                liste, filtres, fiche filière
    ├── espace/                   profil, notes, vœux, recommandations, vue parent
    ├── conseiller/               chat texte + vocal
    └── auth/                     connexion, inscription (élève : NIP + date de naissance ; parent : email)
```

Chaque fonctionnalité est découpée en `data/` (appels et modèles), `providers/` (Riverpod) et `ui/` (écrans et widgets). Les modèles reprennent les types du frontend (`frontend/src/lib/filiere.ts`, `apprenant.ts`) : c'est le contrat de l'API.

---

## Connexion à l'API

| Élément | Valeur |
|---|---|
| URL de base | `--dart-define=API_URL=…` (par défaut `http://10.0.2.2:8080/api` sur l'émulateur Android, `http://localhost:8080/api` sur le simulateur iOS) |
| Authentification | `POST /auth/connexion`, puis `Authorization: Bearer <accessToken>` |
| Rafraîchissement | `POST /auth/refresh` sur une réponse 401, **une seule requête à la fois** (le jeton de rafraîchissement ne sert qu'une fois) |
| Profil et dossiers accessibles | `GET /auth/moi` : `apprenant` pour un élève, `enfants` pour un parent |
| Documentation | `http://localhost:8080/api/docs` |

Le backend limite les tentatives de connexion à 5 par minute et par identifiant. Côté mobile, il suffit d'afficher le message renvoyé en cas de 429.

---

## Design (DSBJ)

À reprendre dans `theme.dart`, comme sur le web (`frontend/tailwind.config.ts`) :

| Rôle | Couleur |
|---|---|
| Primaire | Vert `#008751` |
| Accents | Jaune `#FCD116`, rouge `#E8112D` (erreurs), bleu `#1B6B93` (information) |
| Avertissement | Fond ocre `#C8842A` ; texte ocre foncé `#8C5A14` (contraste AA) |
| Texte / fond | `#161616` / `#F6F6F6` |

Contraintes de `DESIGN.md` §9 :

- zones tactiles d'au moins 44 × 44 ;
- respect des *safe areas* ;
- tirer pour rafraîchir sur les listes ;
- retour visuel au toucher en 150 ms ;
- polices adaptables (respect du réglage d'accessibilité du système).

---

## Hors-ligne

D'après ARCHITECTURE §6 :

- **Consultables hors-ligne** : catalogue, fiches, contenus d'information, profil, notes et dernières recommandations (cache Hive, avec la date de dernière mise à jour affichée).
- **En ligne uniquement** : saisie et validation des vœux, calcul des recommandations, conseiller. Hors-ligne, les boutons concernés sont désactivés et un message l'explique.
- Une file de synchronisation différée ne sera envisagée qu'après le pilote.

---

## Conseiller vocal

- **Saisie vocale** avec `speech_to_text`, **lecture des réponses** avec `flutter_tts`.
- Les **langues nationales** (fongbé en priorité, puis yoruba, bariba, dendi…) passeront par le projet national « J'aime ma langue » (ASIN / IIDIA), selon le calendrier arbitré avec le ministère.
- Le conseiller rappelle qu'il **n'a pas le dernier mot** : l'orientation est décidée par l'élève et sa famille, avec le conseiller d'orientation.

---

## Feuille de route

Tâches de [../TASKS.md](../TASKS.md), phase 4 :

| # | Tâche | Priorité |
|---|---|---|
| 1.5 | Initialisation du projet (voir plus haut) | P0 |
| 4.1 | Navigation 4 onglets, thème DSBJ, providers | P0 |
| 4.2 | Connexion / inscription | P0 |
| 4.3 | Tableau de bord (profil, notes) | P0 |
| 4.4 | Catalogue et fiches | P0 |
| 4.5 | Saisie des vœux | P0 |
| 4.6 | Recommandations expliquées | P0 |
| 4.7 | Hors-ligne (cache Hive) | P1 |
| 4.8 | Conseiller conversationnel | P1 |
| 4.9 | Conseiller vocal | P2 |

---

## Points à trancher

- **Client HTTP** : `http`, comme dans le `pubspec`, ou Dio + Retrofit, comme dans l'ARCHITECTURE ? `http` suffit si l'on écrit un petit intercepteur.
- **Identifiant d'application** et comptes développeur Google Play / Apple : à obtenir auprès du ministère.
- **Calendrier** : réaliser un MVP web installable (PWA) d'abord, puis l'application Flutter, permettrait de tenir l'échéance du pilote. C'est à arbitrer avec le client.
