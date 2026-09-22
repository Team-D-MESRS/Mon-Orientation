import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AuthInitialiser } from '@/components/auth/AuthInitialiser';

export const metadata: Metadata = {
  title: 'Mon Orientation — Plateforme nationale d\'orientation scolaire',
  description: 'Accompagnement personnalisé dans l\'orientation scolaire, de la 4e à la Terminale. République du Bénin.',
  keywords: ['orientation', 'scolaire', 'Bénin', 'éducation', 'formation'],
};

/**
 * Exécuté avant le premier affichage : active les animations au défilement (composant Apparition), sauf si le
 * système demande de réduire les animations. Sans JavaScript, l'attribut n'est pas posé et rien n'est masqué.
 */
const ACTIVER_ANIMATIONS =
  "try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.setAttribute('data-animations','')}catch(e){}";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning : l'attribut data-animations est posé par le script avant l'hydratation
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ACTIVER_ANIMATIONS }} />
      </head>
      {/* Colonne pleine hauteur : sur une page courte, le pied de page reste en bas de l'écran */}
      <body className="min-h-screen flex flex-col">
        <AuthInitialiser />
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-surface focus:text-text focus:shadow-popover">
          Aller au contenu principal
        </a>
        <Header />
        <main id="main" role="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
