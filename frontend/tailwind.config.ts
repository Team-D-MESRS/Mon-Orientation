import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs de marque DSBJ (drapeau + étendues) — identité, navigation, CTA principal.
        'bj-green': '#008751',
        'bj-yellow': '#FCD116',
        'bj-red': '#E8112D',
        'bj-ochre': '#C8842A',
        'bj-ochre-fonce': '#8C5A14',
        'bj-blue': '#1B6B93',
        'bj-gray': {
          50: '#161616',
          100: '#1E1E1E',
          200: '#2A2A2A',
          425: '#3A3A3A',
          500: '#585858',
          625: '#7B7B7B',
          750: '#A8A8A8',
          850: '#CECECE',
          900: '#DDDDDD',
          925: '#E5E5E5',
          950: '#EEEEEE',
          975: '#F6F6F6',
          1000: '#FFFFFF',
        },

        // Design tokens sémantiques — utilisés par les composants de frontend/src/components/ui/ et par
        // components/espace/ui.tsx. Valeurs définies dans globals.css (:root), pas de couleur en dur ici :
        // un seul endroit à changer pour faire évoluer le thème. Les couleurs bj-* ci-dessus restent
        // disponibles pour un usage direct de marque (logo, tricolore) ; les tokens ci-dessous distinguent
        // « couleur de marque » (primary/accent) et « couleur d'état » (success/warning/danger/info), que le
        // DSBJ documente déjà comme deux palettes séparées (§4.1 « principales » vs « fonctionnelles »).
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-raised': 'var(--color-surface-raised)',
        'surface-sunken': 'var(--color-surface-sunken)',

        primary: 'var(--color-primary)',
        'primary-strong': 'var(--color-primary-strong)',
        'primary-soft': 'var(--color-primary-soft)',
        accent: 'var(--color-accent)',
        'accent-strong': 'var(--color-accent-strong)',
        'accent-soft': 'var(--color-accent-soft)',
        terre: 'var(--color-terre)',
        'terre-strong': 'var(--color-terre-strong)',
        'terre-soft': 'var(--color-terre-soft)',

        success: 'var(--color-success)',
        'success-strong': 'var(--color-success-strong)',
        'success-soft': 'var(--color-success-soft)',
        warning: 'var(--color-warning)',
        'warning-strong': 'var(--color-warning-strong)',
        'warning-soft': 'var(--color-warning-soft)',
        danger: 'var(--color-danger)',
        'danger-strong': 'var(--color-danger-strong)',
        'danger-soft': 'var(--color-danger-soft)',
        info: 'var(--color-info)',
        'info-strong': 'var(--color-info-strong)',
        'info-soft': 'var(--color-info-soft)',

        text: 'var(--color-text)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'text-on-primary': 'var(--color-text-on-primary)',

        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        // Réservée aux grands titres (display / H1 de section) pour une touche éditoriale plus chaleureuse
        // qu'un site tout-Montserrat ; jamais pour du texte courant, des boutons ou des libellés d'UI.
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      spacing: {
        '1v': '4px',
        '2v': '8px',
        '3v': '12px',
        '4v': '16px',
        '5v': '20px',
        '6v': '24px',
        '8v': '32px',
        '10v': '40px',
        '12v': '48px',
        '14v': '56px',
        '16v': '64px',
      },
      borderRadius: {
        'bj-sm': 'var(--radius-sm)',
        'bj-md': 'var(--radius-md)',
        'bj-lg': 'var(--radius-lg)',
        card: 'var(--radius-card)',
      },
      boxShadow: {
        // Les 3 niveaux d'élévation DSBJ (§4.6), nommés par usage plutôt que par numéro.
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        popover: 'var(--shadow-popover)',
      },
      height: {
        control: 'var(--control-height-md)',
      },
      screens: {
        // Alias explicite du seuil « petit smartphone » du DESIGN.md (§5.1, < 375px) : les autres paliers du
        // DESIGN.md (sm/md/lg/xl) correspondent déjà à peu de choses près aux valeurs par défaut de Tailwind
        // (640/768/1024/1280px), utilisées de façon cohérente dans tout le code existant — les remplacer
        // décalerait le point de rupture de chaque `sm:`/`md:`/`lg:` déjà écrit, pour un gain non perceptible.
        xs: '375px',
      },
    },
  },
  plugins: [],
};

export default config;
