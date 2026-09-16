# Mon Orientation — Frontend (application web)

Application web de la plateforme nationale d'orientation scolaire. Elle permet :

- de consulter le catalogue des filières ;
- d'accéder à l'espace de l'élève et du parent (notes, vœux, recommandations) ;
- d'échanger avec le conseiller pédagogique ;
- de consulter le tableau de bord de pilotage.

Elle consomme l'API décrite dans [../backend/README.md](../backend/README.md) et suit le design system défini dans [../DESIGN.md](../DESIGN.md).

- **Développement** : `http://localhost:3000`

---

## Sommaire

1. [Stack](#stack)
2. [Installation et lancement](#installation-et-lancement)
3. [Configuration](#configuration)
4. [Structure](#structure)
5. [Pages](#pages)
6. [Authentification côté client](#authentification-côté-client)
7. [Appels à l'API](#appels-à-lapi)
8. [Design system et accessibilité](#design-system-et-accessibilité)
9. [Conventions de code](#conventions-de-code)
10. [Tests](#tests)
11. [Limites connues et suite](#limites-connues-et-suite)
12. [Dépannage](#dépannage)

---

## Stack

| Élément | Choix |
|---|---|
| Framework | Next.js 14.2 (App Router), React 18, TypeScript 5 (strict) |
| Styles | Tailwind CSS 3.4, avec des jetons du DSBJ (couleurs `bj-*`, espacements `1v` à `16v`, rayons `bj-sm/md/lg`) et des classes globales `.bj-*` |
| État | Zustand (`src/stores/` : session, formations mises de côté, sélection du comparateur) |
| HTTP | Axios, avec intercepteurs pour le jeton et son rafraîchissement automatique |
| Icônes | lucide-react |
| Polices | Montserrat (texte) et Spectral (éditorial), via Google Fonts |
| Prévues mais pas encore utilisées | TanStack Query, next-intl (langues nationales), next-pwa (hors-ligne) |

---

## Installation et lancement

Prérequis : Node.js 22 et l'API lancée sur `:8080`. Le plus simple est `bash start.sh` à la racine, qui lance l'API et le frontend.

```bash
cd frontend
npm install
bash setup.sh
cp .env.example .env.local     # facultatif : l'URL par défaut est http://localhost:8080
npm run dev                    # http://localhost:3000
```

| Script | Effet |
|---|---|
| `npm run dev` | Serveur de développement avec rechargement à chaud |
| `npm run build` / `npm run start` | Build de production / serveur de production |
| `npx tsc --noEmit` | Vérification des types, sans toucher au dossier `.next` |
| `npm run lint` | Déclaré, mais ESLint n'est pas encore configuré |

> **Ne lancez pas `npm run build` pendant que `npm run dev` tourne.** Les deux utilisent le même dossier `.next` : le serveur de développement se retrouve cassé (erreurs 500, pages sans style). Vérifiez plutôt les types avec `npx tsc --noEmit`, ou arrêtez d'abord le serveur.

---

## Configuration

| Variable | Défaut | Rôle |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | URL de base de l'API, sans le suffixe `/api` |

Comme toute variable `NEXT_PUBLIC_*`, elle est intégrée au build : il faut rebuilder pour la changer en production. L'origine du frontend doit correspondre à `CORS_ORIGIN` côté backend.

---

## Structure

```
frontend/src/
├── app/                               routes (App Router)
│   ├── layout.tsx                     layout racine : AuthInitialiser, Header, Footer, lien d'évitement
│   ├── globals.css                    import des polices, variables, classes .bj-*
│   ├── page.tsx                       accueil
│   ├── catalogue/layout.tsx           barre du comparateur, sur toutes les pages du catalogue
│   ├── catalogue/page.tsx             catalogue : recherche et filtres, portés par l'adresse (lien partageable)
│   ├── catalogue/[id]/page.tsx        fiche filière : sources, « Et après ce bac ? », cœur, comparer, partage, impression
│   ├── catalogue/comparer/page.tsx    comparaison de 2 ou 3 formations (?ids=…)
│   ├── connexion/ , inscription/      formulaires reliés à l'API
│   ├── espace-apprenant/
│   │   ├── layout.tsx                 RequireAuth → EspaceProvider → CadreEspace (onglets)
│   │   ├── page.tsx                   tableau de bord
│   │   ├── notes/page.tsx             notes par matière et trimestre
│   │   ├── preferences/page.tsx       vœux en 3 étapes (élève) / validation (parent)
│   │   ├── recommandations/page.tsx   recommandations expliquées
│   │   └── conseiller/page.tsx        conversation avec le conseiller pédagogique
│   ├── conseiller/page.tsx            présentation du conseiller ; élèves et parents redirigés vers leur espace
│   ├── (informations)/                guide, faq, contact, mentions-legales, donnees-personnelles, accessibilite (navigation commune)
│   ├── not-found.tsx                  page 404 en français
│   └── stats/ (layout + page)         tableau de bord DGES/admin (maquette, accès protégé)
├── components/
│   ├── layout/                        Header et Footer (liens selon le rôle, définis dans navigation.ts), NavInformations
│   ├── informations/                  EnTete, Bloc, Question (FAQ dépliable), ACompleter, LienExterne
│   ├── auth/                          AuthInitialiser (restaure la session), RequireAuth (garde de page)
│   ├── catalogue/                     CarteFiliere, BoutonFavori, BoutonComparer, BarreComparateur, Partage
│   └── espace/                        EspaceContext (dossier consulté), CadreEspace, ui (Alerte, Carte, BadgeType…),
│                                      TexteConseiller (rendu sûr des réponses du conseiller)
├── lib/
│   ├── api.ts                         client Axios, rafraîchissement du jeton, fonctions par domaine
│   ├── filiere.ts                     types et libellés du catalogue (types, niveaux, domaines), normaliser() sans accents
│   ├── apprenant.ts                   types (profil, bilan, vœux, recommandations) et formatage
│   ├── erreurs.ts                     messageErreur() : message lisible depuis une erreur API
│   ├── site.ts                        éditeur, coordonnées (null tant que le MESTFP ne les a pas communiquées), sites officiels
│   └── redirection.ts                 cheminDeRetour() : ?redirect= limité aux chemins internes
└── stores/
    ├── authStore.ts                   utilisateur connecté, jetons, accueilDuRole()
    ├── favorisStore.ts                formations mises de côté par l'élève connecté (useFavoris)
    └── comparateurStore.ts            sélection du comparateur, conservée dans le navigateur
```

---

## Pages

| Route | Accès | État | Contenu |
|---|---|---|---|
| `/` | public | ✅ API | Accueil : recherche vers le catalogue, raccourci « Que faire après mon bac ? » par série, entrées par profil, étapes du parcours, domaines avec leur nombre de formations (lus dans l'API), conseiller en fongbé ; boutons selon la connexion |
| `/catalogue` | public | ✅ API | 272 formations, affichées 48 par 48 (« Afficher plus ») ; recherche sans accents (formation, métier, ville) ; filtres niveau, type, domaine, série de bac, bourses, source officielle, tous portés par l'adresse (`/catalogue?serie=D`) ; raccourci « Que faire avec mon bac D ? » pour l'élève de 1re ou de Terminale ; cœur (élève) et « Comparer » sur chaque carte |
| `/catalogue/[id]` | public | ✅ API | Fiche complète, domaines cliquables ; section « Admission » pour le supérieur (mode d'entrée, séries, matières du classement, places avec bourse et aides, d'après le guide du MESRS) ; « Et après ce bac ? » sur les fiches de bac, groupé par université ; mettre de côté (élève), comparer, partager (WhatsApp, partage du téléphone, lien), imprimer |
| `/catalogue/comparer` | public | ✅ API | Tableau de 2 ou 3 formations sur 11 critères ; lien partageable ; sans `?ids=`, reprend la sélection faite dans le catalogue |
| `/connexion` | public | ✅ API | NIP ou email + mot de passe ; retour à la page demandée (`?redirect=`) |
| `/inscription` | public | ✅ API | Élève (NIP + date de naissance) ou parent (email) |
| `/espace-apprenant` | élève, parent, admin | ✅ API | Profil, résultats, étape d'orientation, pistes du moment, formations mises de côté |
| `/espace-apprenant/notes` | élève, parent, admin | ✅ API | Tableau par matière et trimestre (vue compacte sur mobile) |
| `/espace-apprenant/preferences` | élève (saisie), parent (validation), admin (lecture) | ✅ API | Vœux en 3 étapes, enregistrés à chaque étape, récapitulatif, motivation ; formations mises de côté proposées en premier, recherche sans accents |
| `/espace-apprenant/recommandations` | élève, parent, admin | ✅ API | Pistes classées, score sur 100, critères détaillés, alertes |
| `/espace-apprenant/conseiller` | élève, parent | ✅ API | Conversation avec le conseiller : suggestions, question conservée en cas d'erreur, nouvelle conversation ; réponses en français ou en fongbé (choix retenu par l'appareil, réponses marquées `lang="fon"`) |
| `/conseiller` | public | ✅ | Présentation ; élèves et parents connectés redirigés vers leur espace |
| `/guide`, `/faq`, `/contact` | public | ✅ statique | Guide d'utilisation, questions fréquentes (dépliables), à qui s'adresser |
| `/mentions-legales`, `/donnees-personnelles`, `/accessibilite` | public | ✅ provisoire | Pages légales à valider par le Ministère ; toute information non communiquée (contact, directeur de la publication, hébergeur, délégué aux données, durée de conservation) est signalée, jamais inventée : la renseigner dans `src/lib/site.ts` |
| `/stats` | DGES, admin | maquette | Tableau de bord, pas encore relié à `/api/stats` |

Selon le rôle, l'espace apprenant s'adapte :

- **élève** : son propre dossier ;
- **parent** : « Suivi de {prénom} », avec un sélecteur quand plusieurs enfants sont rattachés ;
- **admin** : saisie d'un NIP pour ouvrir un dossier.

Un bandeau signale les dossiers de démonstration (NIP en `DEMO-`).

---

## Authentification côté client

1. La **connexion** et l'**inscription** appellent l'API, puis `useAuthStore().login(user, accessToken, refreshToken)` : l'utilisateur et les jetons sont enregistrés dans `localStorage`.
2. Au chargement, **`AuthInitialiser`** restaure la session. Le drapeau `pret` évite de rediriger avant de savoir si l'utilisateur est connecté.
3. **`RequireAuth roles={[…]}`** protège une page ou un layout : sans session, il redirige vers `/connexion?redirect=<page>` ; avec un rôle non autorisé, il affiche « Accès réservé ».
4. **Rafraîchissement** : sur une réponse 401, l'intercepteur Axios demande une nouvelle paire de jetons, **une seule requête à la fois** (le backend révoque chaque jeton après usage), puis rejoue la requête. En cas d'échec, il déconnecte et renvoie vers la connexion.
5. **Déconnexion** : l'appel API révoque les sessions, puis la session locale n'est effacée qu'**une fois arrivé sur l'accueil**. Effacée plus tôt, la page protégée encore affichée redirigerait vers la connexion.
6. Après connexion, l'utilisateur arrive sur `accueilDuRole(role)` : `/espace-apprenant` pour un élève ou un parent, `/stats` pour le DGES ou un admin.

Les jetons sont stockés dans `localStorage`, ce qui suffit pour le MVP. Des cookies `httpOnly` seraient plus robustes face au XSS : c'est à étudier avant la production.

---

## Appels à l'API

Tous les appels passent par `src/lib/api.ts`, qui expose `authApi`, `filiereApi`, `apprenantApi`, `orientationApi`, `conseillerApi` et `statsApi`, avec des réponses typées. Côté pages :

```tsx
const [statut, setStatut] = useState<'chargement' | 'ok' | 'erreur'>('chargement');
useEffect(() => {
  let annule = false;
  filiereApi.list({ niveau: 'APRES_BEPC', limit: 100 })
    .then(({ data }) => { if (!annule) { setFilieres(data.items); setStatut('ok'); } })
    .catch((err) => { if (!annule) setErreur(messageErreur(err)); });
  return () => { annule = true; };   // ignore les réponses arrivées après un changement de page
}, []);
```

- Les erreurs s'affichent avec `messageErreur(err, { 401: '…' })`. Cette fonction gère serveur injoignable, 429 et messages de validation, et accepte des messages personnalisés par statut.
- Chaque page prévoit trois états : chargement (squelettes ou « Chargement… »), erreur (`<Alerte ton="erreur">`, avec « Réessayer » si utile) et résultat vide.

---

## Design system et accessibilité

La conformité au **DSBJ** est adaptée dans `tailwind.config.ts` et `globals.css` :

| Jeton | Valeur | Usage |
|---|---|---|
| `bj-green` | `#008751` | Actions principales, liens, succès |
| `bj-yellow` | `#FCD116` | Accents (bandeau tricolore) |
| `bj-red` | `#E8112D` | Erreurs |
| `bj-blue` | `#1B6B93` | Information |
| `bj-ochre` | `#C8842A` | Fonds et bordures d'avertissement |
| `bj-ochre-fonce` | `#8C5A14` | **Textes** d'avertissement : l'ocre DSBJ n'atteint pas le contraste AA sur fond clair |
| `bj-gray-*` | échelle inversée : `50` = `#161616` (texte), `975` = `#F6F6F6` (fond) | |
| Espacements | `1v` = 4 px … `16v` = 64 px | `p-4v`, `gap-6v`… |

Classes globales disponibles : `.bj-container`, `.bj-header` (bandeau tricolore), `.bj-btn`, `.bj-btn-primary`, `.bj-btn-secondary`, `.bj-card` et `.bj-tricolore`.

Tailwind ne génère que les classes qu'il trouve dans les fichiers de `src/app`, `src/components`, `src/lib` et `src/pages`. Une classe construite dynamiquement (`` `text-${x}` ``) n'est pas générée : écrivez toujours la classe complète.

Les classes `.bj-*` de `globals.css` sont déclarées après les utilitaires Tailwind : à spécificité égale, elles l'emportent. Elles ne doivent donc fixer que ce qu'aucun utilitaire ne vient compléter sur le même élément. C'est pourquoi `.bj-container` ne fixe que les marges et le padding horizontaux : `bj-container py-8v` fonctionne.

Animations au défilement (accueil) : le composant `Apparition` (`src/components/animation/`) fait apparaître un bloc en fondu quand il entre à l'écran (effets `monter`, `gauche`, `droite`, `zoom`, `delai` pour décaler une série), et `Compteur` fait défiler un nombre. Les éléments ne sont masqués que si le script de `layout.tsx` a posé `data-animations` sur `<html>` avant le premier affichage. Sans JavaScript, à l'impression et avec la préférence système « réduire les animations », tout reste visible et immobile. Placer `Apparition` sur l'élément qui enveloppe une `.bj-card` plutôt que sur la carte elle-même, pour garder son effet au survol.

**Accessibilité (WCAG 2.1 AA)** :

- lien « Aller au contenu principal » ;
- un `label` pour chaque champ, `aria-describedby` pour les aides ;
- `role="alert"` pour les erreurs et `aria-live` pour les résultats de recherche ;
- `aria-current` sur l'onglet actif, `role="progressbar"` et `role="meter"` pour les jauges ;
- tableaux avec `caption`, `scope` et en-têtes de ligne ;
- contrastes vérifiés ;
- aucune page ne déborde horizontalement à 390 px (vérifié par les tests navigateur).

---

## Conventions de code

- Les noms métier, les libellés et les commentaires sont **en français** (`chargement`, `messageErreur`, `SaisieDesVoeux`).
- Les pages interactives sont des composants client (`'use client'`). Les layouts protégés composent `RequireAuth` côté serveur.
- Les types et libellés partagés vivent dans `src/lib/`, jamais dupliqués dans les pages.
- Pas de lien mort : une fonction non disponible est expliquée en texte (par exemple « Mot de passe oublié ? Rapproche-toi de ton établissement. »).
- Les pages s'adressent à l'élève en le **tutoyant**, comme dans les maquettes de `DESIGN.md`.

---

## Tests

Les tests de bout en bout se trouvent dans le dossier racine `tests/e2e/`. Ils pilotent Chrome en headless, sans dépendance supplémentaire, contre le serveur lancé :

```bash
node tests/e2e/connexion.mjs        # redirections, erreurs, session, déconnexion, inscription
node tests/e2e/parcours-eleve.mjs   # vœux en 3 étapes, recommandations, validation parent, mobile 390 px
node tests/e2e/conseiller.mjs       # présentation, onglet Conseiller, suggestions, sans clé ou avec clé
node tests/e2e/catalogue.mjs        # filtres, comparateur, « Et après ce bac ? », partage, impression, cœurs, mobile 390 px
node tests/e2e/pied-de-page.mjs     # pages d'information, liens du pied de page, pied de page toujours en bas, 404
```

Le pied de page reste en bas de l'écran sur une page courte : `body` est une colonne flexible de hauteur minimale 100 %, et `main` prend la place restante (`flex-1`). Il suit le contenu sur une page longue, et ne recouvre donc jamais la page.

Sur mobile, un contenu trop large élargit la fenêtre émulée : les tests vérifient donc `innerWidth === 390`, et pas seulement `scrollWidth <= innerWidth`. Un texte `sr-only` (position absolue) placé dans un conteneur qui défile horizontalement élargit la page si ce conteneur n'est pas `relative`.

Les captures d'écran sont écrites dans `tests/e2e/captures/`. Il n'y a pas encore de tests unitaires (tâche 7.2).

---

## Limites connues et suite

- **Statistiques** : page en maquette, à relier à l'API (tâche 6.3).
- **Conseiller** : réponses affichées d'un bloc, sans streaming ; pas encore d'historique des conversations à l'écran. Les réponses sont rendues sans HTML : seuls le gras, les listes et les liens internes (`/catalogue/…`, `/espace-apprenant/…`) sont interprétés.
- **Accueil** : contenu statique ; le module d'information par palier reste à faire (tâche 3.8).
- **PWA** (hors-ligne) et **multilinguisme** : dépendances installées, rien de configuré (tâches 3.9 et i18n).
- **Catalogue** : pas encore de filtre par département ni de carte (il faut d'abord la liste des établissements). La sélection du comparateur reste dans le navigateur ; les formations mises de côté sont, elles, enregistrées sur le serveur.
- **Administration** du référentiel, des utilisateurs et des rattachements parent-enfant : à faire (tâche 3.10).

---

## Dépannage

| Symptôme | Solution |
|---|---|
| `next dev` s'arrête sans message juste après « Starting… » | Binaire SWC tronqué : `rm -rf node_modules/@next/swc-linux-x64-gnu && npm install` |
| `Next.js build worker exited with code: null and signal: SIGBUS` | Même cause que ci-dessus |
| Erreur 500 `Cannot find module './vendor-chunks/…'`, pages sans CSS | `next build` lancé pendant `next dev` : arrêter, `rm -rf .next`, relancer `npm run dev` |
| Une classe Tailwind récente n'a pas d'effet | Si `tailwind.config.ts` a été modifié, relancer le serveur de développement |
| « Serveur injoignable » partout | API arrêtée ou `NEXT_PUBLIC_API_URL` incorrecte ; vérifier `http://localhost:8080/api/docs` |
| Redirection en boucle vers `/connexion` | Jetons expirés ou invalides : se déconnecter, ou vider `localStorage` (`accessToken`, `refreshToken`, `utilisateur`) |
