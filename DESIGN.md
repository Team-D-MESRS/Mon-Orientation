# DESIGN.md — Parcours utilisateurs et design system

## Mon Orientation — Plateforme nationale d'orientation scolaire

| Champ | Valeur |
|---|---|
| **Date** | 11 septembre 2026 |
| **Référence** | SPEC.md v1, ARCHITECTURE.md v1 |
| **Statut** | Document de travail (à valider) |
| **Design system** | DSBJ (Design Système du Bénin) |

---

## 1. Personas

### 1.1 Adama — Élève de 4e

| Attribut | Détail |
|---|---|
| **Âge** | 13 ans |
| **Lieu** | Porto-Novo, Bénin |
| **Niveau tech** | Basique (utilise le téléphone familial) |
| **Langue** | Français + Fongbé |
| **Besoin** | Découvrir les filières possibles après la 3e |
| **Frustration** | « Je ne sais pas quels métiers existent, mes parents veulent que j'aille à l'université » |
| **Device** | Android bas de gamme, connexion 3G intermittente |

### 1.2 Fatou — Élève de 3e

| Attribut | Détail |
|---|---|
| **Âge** | 15 ans |
| **Lieu** | Parakou, Bénin |
| **Niveau tech** | Intermédiaire |
| **Langue** | Français + Bariba |
| **Besoin** | Choisir entre filière technique, professionnelle ou générale |
| **Frustration** | « Les séances d'orientation au collège sont rapides, j'ai pas le temps de poser mes questions » |
| **Device** | Smartphone personnel, connexion 4G |

### 1.3 Moussa — Parent d'élève

| Attribut | Détail |
|---|---|
| **Âge** | 42 ans |
| **Lieu** | Natitingou, Bénin |
| **Niveau tech** | Basique |
| **Langue** | Français + Bariba (oral uniquement) |
| **Besoin** | Comprendre les débouchés concrets de chaque filière |
| **Frustration** | « Je ne sais pas ce que gagne un technicien vs un universitaire » |
| **Device** | Feature phone ou Android bas de gamme |

### 1.4 Aïssatou — Conseillère d'orientation

| Attribut | Détail |
|---|---|
| **Âge** | 35 ans |
| **Lieu** | Cotonou, Bénin |
| **Niveau tech** | Bon |
| **Langue** | Français |
| **Besoin** | Suivre les orientations données, avoir des stats par département |
| **Frustration** | « Je n'ai pas de vue d'ensemble sur les choix des élèves de ma zone » |
| **Device** | PC + smartphone |

### 1.5 Directeur DGES — Pilote national

| Attribut | Détail |
|---|---|
| **Âge** | 50 ans |
| **Lieu** | Cotonou (siège ministère) |
| **Niveau tech** | Moyen |
| **Langue** | Français |
| **Besoin** | Avoir des indicateurs de pilotage en temps réel |
| **Frustration** | « Les rapports arrivent avec 6 mois de retard, je ne peux pas piloter » |
| **Device** | PC |

---

## 2. Parcours utilisateurs

### 2.1 Parcours — Adama (élève, 4e)

```
Découvrir l'orientation
         │
         ▼
┌─────────────────────────┐
│  1. Accueil             │
│  - Voit les filières    │
│  - Message d'accueil    │
│  - CTA : "Découvrir"    │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  2. Catalogue           │
│  - Fiches par filière   │
│  - Recherche / filtres  │
│  - Mode : cards visuelles│
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  3. Fiche filière       │
│  - Description          │
│  - Débouchés            │
│  - Métiers visés        │
│  - Taux d'insertion     │
│  - Vidéo explicative    │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  4. Conseiller IA       │
│  - "À quoi mène cette   │
│     filière ?"          │
│  - Réponse vocale en    │
│     Fongbé              │
└─────────────────────────┘
```

### 2.2 Parcours — Fatou (élève, 3e — saisie des préférences)

```
Orienter mon choix
         │
         ▼
┌─────────────────────────┐
│  1. Mon espace          │
│  - Tableau de bord      │
│  - Notes depuis EducM.  │
│  - Badge "Préparer mon  │
│    choix d'orientation" │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  2. Mes notes           │
│  - Matières + moyennes  │
│  - Tendances (fortes/   │
│    faibles)             │
│  - "Tes forces :        │
│     Maths, SVT"         │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  3. Mes préférences     │
│  - Sélection 3 filières │
│  - Motivation (optionnel)│
│  - Validation parent    │
│  ┌─────┐ ┌─────┐ ┌─────┐│
│  │Filié│ │Filié│ │Filié││
│  │re 1 │ │re 2 │ │re 3 ││
│  └─────┘ └─────┘ └─────┘│
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  4. Mes recommandations │
│  - 3 propositions       │
│  - Score de compatibilité│
│  - Explication : "Car   │
│    tes notes en maths   ││
│    sont élevées..."     │
│  - Comparer les options │
└─────────────────────────┘
```

### 2.3 Parcours — Moussa (parent, non lettré)

```
Comprendre les filières
         │
         ▼
┌─────────────────────────┐
│  1. Accueil (simplifiée)│
│  - "Parler à l'assistant"│
│  - Icône micro grande   │
│  - Minimal de texte     │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  2. Assistant vocal     │
│  - Appui sur le micro   │
│  - "Quels métiers peut  │
│     faire mon fils ?"   │
│  - Réponse en Bariba    │
│  - Illustrations simples│
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  3. Résultat visuel     │
│  - Pictogrammes métiers │
│  - Barres de "salaire   │
│     moyen" (icônes)     │
│  - "Bon choix" / "Autre │
│     possibilité"        │
└─────────────────────────┘
```

### 2.4 Parcours — Aïssatou (conseillère d'orientation)

```
Suivre les orientations
         │
         ▼
┌─────────────────────────┐
│  1. Dashboard           │
│  - Stats par département│
│  - Filtres : filière,   │
│    année, palier        │
│  - Graphiques :         │
│    répartition filières │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  2. Détail département  │
│  - Liste des établis.   │
│  - Taux d'orientation   │
│  - Comparaison avec     │
│    moyenne nationale    │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  3. Rapport             │
│  - Export PDF / Excel   │
│  - Synthèse recommandée │
└─────────────────────────┘
```

---

## 3. Architecture des pages

### 3.1 Structure de navigation

**Web (Next.js), routes réelles (17/09/2026) :**
```
/ (accueil)
├── /catalogue (liste des filières)
│   ├── /catalogue/:id (fiche filière)
│   └── /catalogue/comparer
├── /espace-apprenant (tableau de bord)
│   ├── /espace-apprenant/decouverte (questionnaire de découverte)
│   ├── /espace-apprenant/notes
│   ├── /espace-apprenant/preferences (vœux)
│   ├── /espace-apprenant/recommandations
│   └── /espace-apprenant/conseiller (chat IA)
├── /conseiller (présentation publique, redirige les élèves/parents connectés)
├── /identification (élèves et parents — EducMaster, remplace l'ancien /connexion)
├── /personnels (administration, DGES, établissement — remplace l'ancien /inscription)
├── /stats (DGES — dashboard, encore à brancher sur les vraies données, voir JOURNAL.md)
└── /guide, /faq, /contact, /mentions-legales, /donnees-personnelles, /accessibilite
```
Pas de version mobile (décision du 17/09/2026) ; pas de back-office `/admin` (TASKS.md 3.10, non commencé).

### 3.2 Plan des pages web

#### Page d'accueil (`/`)

```
┌──────────────────────────────────────────────┐
│ [Bande tricolore — DSBJ]                      │
│ [Header: République du Bénin | Mon Orientation]│
├──────────────────────────────────────────────┤
│                                               │
│  HERO                        ┌──────────────┐ │
│  « Choisis ton avenir avec   │ Que faire     │ │
│    confiance »               │ après mon bac?│ │
│  De la 4e à la Terminale…    │ [A1][A2][B]…  │ │
│  [🔍 formation, métier…][OK] │ (14 séries)   │ │
│  ou parcourir le catalogue → │ Tu es en 3e ? │ │
│  [Se connecter] Créer un     │ → après BEPC  │ │
│  compte (ou [Mon espace])    └──────────────┘ │
│                                               │
├──────────────────────────────────────────────┤
│  PAR OÙ COMMENCER ?                           │
│  [4e ou 3e] [1re ou Terminale] [Parent]       │
├──────────────────────────────────────────────┤
│  COMMENT ÇA MARCHE ?                          │
│  ① Explore ② Découvre tes pistes              │
│  ③ Saisis tes vœux ④ Décide en famille        │
├──────────────────────────────────────────────┤
│  EXPLORE PAR DOMAINE                          │
│  « 272 formations recensées dans 16 domaines » │
│  [icône + domaine + nombre] × 14              │
├──────────────────────────────────────────────┤
│  NOUVEAU : LE CONSEILLER RÉPOND EN FONGBÉ     │
│  texte + [Poser une question] | exemple       │
│  d'échange en fongbé avec sa traduction       │
├──────────────────────────────────────────────┤
│  ENGAGEMENTS : sources citées · la plateforme │
│  propose, tu décides · dossier protégé        │
├──────────────────────────────────────────────┤
│ [Footer DSBJ — aide, sites officiels, légal]  │
└──────────────────────────────────────────────┘
```

Règles de contenu (septembre 2026) : les chiffres (formations, domaines, séries) sont lus dans l'API, jamais écrits en dur ; seules les langues réellement disponibles sont annoncées (fongbé) ; les statistiques nationales, réservées à la DGES, ne figurent pas sur l'accueil. Animations discrètes au défilement : fondu avec léger glissement, éléments d'une même série décalés, compteur du nombre de formations. Elles sont désactivées quand le système demande de réduire les animations.

#### Page Catalogue (`/catalogue`)

```
┌──────────────────────────────────────────────┐
│ [Header DSBJ]                                 │
├──────────────────────────────────────────────┤
│                                               │
│  CATALOGUE DES FILIÈRES                       │
│                                               │
│  🔍 Rechercher une filière, un métier...      │
│                                               │
│  Filtres: [Type ▼] [Département ▼] [Niveau ▼]│
│                                               │
│  Résultats: 247 filières                      │
│                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │ [icone]     │ │ [icone]     │ │ [icone] │ │
│  │ Baccalauréat│ │ Baccalauréat│ │ CAP/BEP │ │
│  │ Général     │ │ Technique   │ │ Métiers │ │
│  │ 120 filières│ │ 85 filières │ │ 42 fil. │ │
│  └─────────────┘ └─────────────┘ └─────────┘ │
│                                               │
│  ── Liste des filières ──                     │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │ [img] Baccalauréat Technologique        │ │
│  │       Options : Sciences & Techniques   │ │
│  │       Débouchés : Ingénieur, Technicien │ │
│  │       Taux insertion : 72%              │ │
│  │                          [Voir →]       │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ [img] École de Métiers                  │ │
│  │       Menuiserie, Électricité...        │ │
│  │       Débouchés : Artisan qualifié      │ │
│  │       Taux insertion : 85%              │ │
│  │                          [Voir →]       │ │
│  └─────────────────────────────────────────┘ │
│                                               │
├──────────────────────────────────────────────┤
│ [Footer DSBJ]                                 │
└──────────────────────────────────────────────┘
```

#### Page Fiche filière (`/catalogue/:id`)

```
┌──────────────────────────────────────────────┐
│ [Header DSBJ]                                 │
├──────────────────────────────────────────────┤
│  ← Retour au catalogue                        │
│                                               │
│  BACCALAURÉAT TECHNIQUE                       │
│  Sciences & Techniques de l'Ingénieur         │
│                                               │
│  ┌───────────────────────────────────────┐   │
│  │ [Image/Video représentative]           │   │
│  └───────────────────────────────────────┘   │
│                                               │
│  📋 DESCRIPTION                               │
│  formation en 3 ans préparant au bac...       │
│                                               │
│  🎓 DIPLOMES DÉLIVRÉS                         │
│  • Baccalauréat Technologique                 │
│                                               │
│  💼 MÉTIERS VISÉS                             │
│  • Ingénieur technicien                       │
│  • Chef de projet technique                   │
│                                               │
│  📊 TAUX D'INSERTION                          │
│  ████████████░░░░ 72%                         │
│                                               │
│  🏫 ÉTABLISSEMENTS                            │
│  Lycée Technique de Porto-Novo                │
│  Lycée Technique de Cotonou                  │
│                                               │
│  💰 BOURSES DISPONIBLES                       │
│  Oui — bourses nationales                     │
│                                               │
│  🤖 [Parler au conseiller IA à propos de      │
│      cette filière]                           │
│                                               │
├──────────────────────────────────────────────┤
│ [Footer DSBJ]                                 │
└──────────────────────────────────────────────┘
```

#### Espace Apprenant — Mes préférences (`/espace-apprenant/preferences`)

```
┌──────────────────────────────────────────────┐
│ [Header DSBJ]                                 │
├──────────────────────────────────────────────┤
│  MES PRÉFÉRENCES D'ORIENTATION                │
│                                               │
│  ┌─────────────────────────────────────┐     │
│  │ Étape 1/3 : Choisis ta 1ère option  │     │
│  │ ████████░░░░░░░░░░░░ 33%            │     │
│  └─────────────────────────────────────┘     │
│                                               │
│  Quelle filière t'intéresse le plus ?         │
│                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ □ Général│ │ □ Techni-│ │ □ Profes-│       │
│  │         │ │   que   │ │  sionnel│        │
│  └─────────┘ └─────────┘ └─────────┘        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ □ École │ │ □ Agricole│ │ □ Autre │       │
│  │  Métiers│ │         │ │         │        │
│  └─────────┘ └─────────┘ └─────────┘        │
│                                               │
│  Motivation (optionnel) :                     │
│  ┌─────────────────────────────────────┐     │
│  │ Pourquoi ce choix ?                  │     │
│  └─────────────────────────────────────┘     │
│                                               │
│              [Suivant →]                      │
│                                               │
├──────────────────────────────────────────────┤
│ [Footer DSBJ]                                 │
└──────────────────────────────────────────────┘
```

#### Conseiller IA — Interface conversationnelle (`/conseiller`)

```
┌──────────────────────────────────────────────┐
│ [Header DSBJ]                                 │
├──────────────────────────────────────────────┤
│  CONSEILLER PÉDAGOGIQUE                       │
│  Assistant intelligent · Français, Fongbé...  │
│                                               │
│  ┌─────────────────────────────────────┐     │
│  │ 💬 Bonjour Adama ! Je suis ton      │     │
│  │ assistant d'orientation.            │     │
│  │                                     │     │
│  │ Comment puis-je t'aider ?           │     │
│  │                                     │     │
│  │ • "Quelles filières pour les maths?" │     │
│  │ • "C'est quoi un technicien ?"      │     │
│  │ • "Aide-moi à choisir"             │     │
│  └─────────────────────────────────────┘     │
│                                               │
│  ┌─────────────────────────────────────┐     │
│  │ 👤 Moi : À quoi mène la filière     │     │
│  │           "École de Métiers" ?      │     │
│  └─────────────────────────────────────┘     │
│                                               │
│  ┌─────────────────────────────────────┐     │
│  │ 🤖 L'école de Métiers forme des     │     │
│  │ artisans qualifiés en 2 ans.        │     │
│  │ Les métiers : menuisier,            │     │
│  │ électricien, plombier...            │     │
│  │                                     │     │
│  │ 💰 Salaire moyen : 75 000 FCFA     │     │
│  │ 📈 Taux d'insertion : 85%           │     │
│  │                                     │     │
│  │ [Voir la fiche complète →]          │     │
│  └─────────────────────────────────────┘     │
│                                               │
│  ┌───────────────────────────────────┐ [🎤]  │
│  │ Écris ton message...              │ [➤]  │
│  └───────────────────────────────────┘       │
│                                               │
│  Langue: [Français ▼]                        │
│                                               │
├──────────────────────────────────────────────┤
│ [Footer DSBJ]                                 │
└──────────────────────────────────────────────┘
```

---

## 4. Design System — Adaptation DSBJ

### 4.1 Palette de couleurs

La plateforme utilise la palette officielle du DSBJ. Pas de dérive couleurs.

**Couleurs principales (drapeau) :**
| Rôle | Couleur | Code | Variable CSS |
|---|---|---|---|
| Primaire (action) | Vert Bénin | `#008751` | `--bj-color-vert-benin-main-491` |
| Accent | Jaune Bénin | `#FCD116` | `--bj-color-jaune-benin-main-822` |
| Alerte / Important | Rouge Bénin | `#E8112D` | `--bj-color-rouge-benin-main-472` |

**Couleurs étendues :**
| Rôle | Couleur | Code | Variable CSS |
|---|---|---|---|
| Info / Liens | Bleu Horizon | `#1B6B93` | `--bj-color-bleu-horizon-main-491` |
| Terre / Warm | Ocre Terre | `#C8842A` | `--bj-color-ocre-terre-main-620` |

**Fonctionnelles :**
| Rôle | Couleur | Code |
|---|---|---|
| Succès | Vert foncé | `#18753C` |
| Info | Bleu | `#0063CB` |
| Alerte | Orange | `#D64D00` |
| Erreur | Rouge | `#CE0500` |

**Neutres (gris) :**
| Rôle | Usage | Token |
|---|---|---|
| Texte principal | Titres, body | `gris-50` à `gris-200` |
| Texte secondaire | Labels, hints | `gris-500` à `gris-625` |
| Borders | Séparateurs, contours | `gris-850` à `gris-925` |
| Fond principal | Background | `gris-975` ou `gris-1000` (blanc) |
| Fond alterné | Sections alternées | `gris-950` |

### 4.2 Typographie

| Élément | Police | Graisse | Taille |
|---|---|---|---|
| Display XL | Montserrat | Bold (700) | 48px / 3rem |
| Display LG | Montserrat | Bold (700) | 36px / 2.25rem |
| H1 | Montserrat | Bold (700) | 30px / 1.875rem |
| H2 | Montserrat | Semibold (600) | 24px / 1.5rem |
| H3 | Montserrat | Semibold (600) | 20px / 1.25rem |
| Body LG | Montserrat | Regular (400) | 18px / 1.125rem |
| Body | Montserrat | Regular (400) | 16px / 1rem |
| Body SM | Montserrat | Regular (400) | 14px / 0.875rem |
| Caption | Montserrat | Regular (400) | 12px / 0.75rem |

**Interligne :**
- Tight : 1.25 (titres)
- Normal : 1.5 (corps)
- Loose : 1.75 (citations, longs textes)

### 4.3 Espacement

Base : **4px** (unité fondamentale)

| Token | Valeur | Usage |
|---|---|---|
| `--bj-spacing-1v` | 4px | micro espacement |
| `--bj-spacing-2v` | 8px | espacement éléments proches |
| `--bj-spacing-3v` | 12px | padding cards, boutons |
| `--bj-spacing-4v` | 16px | espacement entre blocs |
| `--bj-spacing-6v` | 24px | entre sections |
| `--bj-spacing-8v` | 32px | grandes sections |
| `--bj-spacing-12v` | 48px | séparations majeures |
| `--bj-spacing-16v` | 64px | hero, footer |

### 4.4 Composants DSBJ — Mapping

| Composant DSBJ | Usage dans Mon Orientation |
|---|---|
| `bj-header` | En-tête de toutes les pages, bande tricolore |
| `bj-footer` | Pied de page, mentions légales |
| `bj-card` | Fiches de filières, actualités, recommandations |
| `bj-tile` | Accès rapides (catalogue, conseiller, stats) |
| `bj-btn` | Actions principales (CTA), secondaires |
| `bj-btn--secondary` | Actions secondaires, navigation |
| `bj-alert` | Notifications (succès, erreur, info) |
| `bj-modal` | Dialogues (validation préférences, détails) |
| `bj-accordion` | Détails de filière, FAQ, sections pliables |
| `bj-table` | Données tabulaires (stats, notes) |
| `bj-form` | Formulaires (inscription, préférences) |
| `bj-callout` | Mises en avant (campagne, nouveauté) |
| `bj-search` | Recherche dans le catalogue |
| `bj-container` | Conteneur principal (max-width responsive) |
| `bj-skiplinks` | Accessibilité navigation clavier |

### 4.5 Icônes

- **Librairie** : Remix Icon (incluse dans DSBJ)
- **Taille standard** : 24px
- **Taille hero** : 48px
- **Couleur** : inherit (couleur du texte parent)
- **Usage** : accompagner un texte, jamais seul (accessibilité)

**Icônes clés :**
| Action | Icône |
|---|---|
| Catalogue | `ri-book-open-line` |
| Conseiller IA | `ri-question-answer-line` |
| Mon espace | `ri-user-line` |
| Notes | `ri-bar-chart-box-line` |
| Préférences | `ri-heart-line` |
| Recommandation | `ri-lightbulb-line` |
| Microphone (vocal) | `ri-mic-line` |
| Envoyer | `ri-send-plane-fill` |
| Retour | `ri-arrow-left-line` |
| Filtre | `ri-filter-3-line` |
| Recherche | `ri-search-line` |
| Statistiques | `ri-pie-chart-line` |
| Déconnexion | `ri-logout-box-r-line` |
| Succès | `ri-check-line` |
| Alerte | `ri-error-warning-line` |

### 4.6 Ombres et élévation

| Niveau | Ombre | Usage |
|---|---|---|
| Level 1 | `0 1px 3px rgba(0,0,0,0.08)` | Cards au repos |
| Level 2 | `0 4px 12px rgba(0,0,0,0.12)` | Cards au hover, dropdowns |
| Level 3 | `0 8px 24px rgba(0,0,0,0.16)` | Modals, popovers |

### 4.7 Border radius

| Token | Valeur | Usage |
|---|---|---|
| `--bj-radius-sm` | 4px | Boutons, inputs |
| `--bj-radius-md` | 8px | Cards, tiles |
| `--bj-radius-lg` | 12px | Modals, sections |
| `--bj-radius-full` | 9999px | Badges, avatars |

---

## 5. Responsive design

### 5.1 Breakpoints

| Breakpoint | Largeur | Cible |
|---|---|---|
| `xs` | < 375px | Petits smartphones |
| `sm` | 375px - 767px | Smartphones |
| `md` | 768px - 1023px | Tablets |
| `lg` | 1024px - 1439px | Desktops |
| `xl` | ≥ 1440px | Grands écrans |

### 5.2 Grille

- **Mobile** : 4 colonnes, padding 16px
- **Tablet** : 8 colonnes, padding 24px
- **Desktop** : 12 colonnes, padding 32px, max-width 1200px

### 5.3 Patterns responsive

**Catalogue (grille de cards) :**
- Mobile : 1 colonne (stack vertical)
- Tablet : 2 colonnes
- Desktop : 3 colonnes

**Navigation :**
- Mobile : Bottom navigation bar (4 items)
- Tablet/Desktop : Header horizontal + sidebar optionnelle

**Conseiller IA :**
- Mobile : Plein écran, keyboard overlay
- Desktop : Panel latéral ou pleine page

---

## 6. Accessibilité (WCAG 2.1 AA)

### 6.1 Contraste

| Élément | Ratio minimum | Vérification |
|---|---|---|
| Texte normal (< 18px) | 4.5:1 | Gris-50 sur gris-1000 ✅ |
| Texte gras / large (≥ 18px) | 3:1 | Vert sur blanc ✅ |
| Icônes interactives | 3:1 | Remix Icon inherit ✅ |
| Focus ring | 3:1 | Vert Bénin sur blanc ✅ |

### 6.2 Navigation clavier

- Tous les éléments interactifs accessibles via Tab/Shift+Tab
- Focus visible : outline 2px `--bj-color-vert-benin-main-491`
- Skip links : « Aller au contenu principal »
- Modales : trap du focus
- Escape pour fermer les modales

### 6.3 ARIA

- `role="banner"` sur le header
- `role="main"` sur le contenu principal
- `role="navigation"` sur les menus
- `aria-label` sur les boutons icônes
- `aria-live` sur les zones de notification
- `aria-expanded` sur les accordéons
- `aria-current="page"` sur la navigation active

### 6.4 Accessibilité spécifique Bénin

- **Mode haute contraste** : option accessible depuis le header
- **Taille de texte** : boutons A+ / A- pour ajuster la taille
- **Support lecteur d'écran** : tous les contenus alternatifs fournis
- **Vocal** : le conseiller IA fonctionne entièrement à l'oral

---

## 7. Animations et micro-interactions

### 7.1 Principes

- **Durée** : 150ms - 300ms (micro-interactions), 300ms - 500ms (transitions de page)
- **Easing** : `ease-out` pour les entrées, `ease-in` pour les sorties
- **Motion = signification** : chaque animation communique un changement d'état
- **Respect** : `prefers-reduced-motion` doit être supporté

### 7.2 Animations clés

| Élément | Animation | Durée |
|---|---|---|
| Cards catalogue | Fade-in + slide-up au scroll | 200ms |
| Hover card | Scale 1.02 + ombre augmentée | 150ms |
| Bouton CTA | Pulse subtil (vert → vert foncé) | 200ms |
| Navigation mobile | Slide-in depuis la gauche | 250ms |
| Modale | Fade-in overlay + scale 0.95 → 1 | 200ms |
| Conseiller IA (message) | Slide-up depuis le bas | 150ms |
| Recommandation | Flip reveal du score | 300ms |
| Loading spinner | Rotation continue | 1000ms |
| Progress bar | Width transition | 300ms |

### 7.3 Réduction de mouvement

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Patterns UX spécifiques

### 8.1 Formulaire multi-étapes (préférences)

- **Indicateur de progression** visible en permanence (étape 1/3)
- **Validation inline** : chaque champ validé en temps réel
- **Sauvegarde auto** : les choix sont sauvegardés à chaque étape
- **Retour arrière** possible sans perte de données
- **Récapitulatif** avant soumission finale

### 8.2 Mode hors-ligne

**Indicateur visuel :**
```
┌─────────────────────────────┐
│ ⚡ Mode hors-ligne           │
│ Les contenus disponibles    │
│ sont affichés ci-dessous    │
└─────────────────────────────┘
```

**Comportement :**
- Bannière jaune en haut de page si hors-ligne
- Les contenus déjà consultés restent accessibles
- Les fonctionnalités en ligne (conseiller IA, soumission) sont grisées
- Sync automatique quand la connexion revient

### 8.3 Conseiller IA — Patterns conversation

- **Bubble user** : fond vert clair, aligné à droite
- **Bubble IA** : fond gris clair, aligné à gauche
- **Timestamp** : discrètement sous chaque message
- **Suggestion chips** : questions prédéfinies pour guider
- **Indicateur de frappe** : 3 points animés pendant que l'IA "réfléchit"
- **Bouton micro** : toujours visible, gros, facile à atteindre (pouce)
- **Sélection de langue** : en bas du chat, accessible

### 8.4 Gamification légère

- **Badge de progression** : « Tu as découvert 5 filières ! »
- **Streak** : « Tu consultes Mon Orientation depuis 3 jours »
- **Pas de classment** : éviter la compétition entre élèves

---

*(Section 9 « Spécifications mobile (Flutter) » retirée — décision du 17/09/2026, pas de version mobile, voir
JOURNAL.md. Numérotation suivante inchangée.)*

---

## 10. Spécifications PWA (Web)

### 10.1 Manifest

```json
{
  "name": "Mon Orientation",
  "short_name": "Orientation",
  "description": "Plateforme nationale d'orientation scolaire du Bénin",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F6F6F6",
  "theme_color": "#008751",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 10.2 Service Worker

- **Cache first** pour les assets statiques (CSS, JS, images)
- **Network first** pour les API calls
- **Stale while revalidate** pour le catalogue (données relativement stables)
- **Offline fallback** : page personnalisée si aucune donnée en cache

### 10.3 Installation

- Banner « Installer Mon Orientation » après 3 visites
- Instructions par plateforme (Android, iOS Safari, Desktop)
