import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Page introuvable — Mon Orientation' };

export default function PageIntrouvable() {
  return (
    <div className="bj-container py-16v text-center">
      <p className="text-sm font-bold text-bj-green">Erreur 404</p>
      <h1 className="text-3xl font-bold mt-2v mb-4v">Page introuvable</h1>
      <p className="text-bj-gray-500 mb-8v">Cette page n&apos;existe pas ou a été déplacée.</p>
      <div className="flex flex-wrap justify-center gap-3v">
        <Link href="/" className="bj-btn bj-btn-primary">
          Retour à l&apos;accueil
        </Link>
        <Link href="/catalogue" className="bj-btn bj-btn-secondary">
          Catalogue des filières
        </Link>
        <Link href="/guide" className="bj-btn bj-btn-secondary">
          Guide d&apos;utilisation
        </Link>
      </div>
    </div>
  );
}
