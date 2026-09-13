import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Mon Orientation — Plateforme nationale d\'orientation scolaire',
  description: 'Accompagnement personnalisé dans l\'orientation scolaire, de la 4e à la Terminale. République du Bénin.',
  keywords: ['orientation', 'scolaire', 'Bénin', 'éducation', 'formation'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white">
          Aller au contenu principal
        </a>
        <Header />
        <main id="main" role="main">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
