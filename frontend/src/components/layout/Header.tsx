'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bj-header sticky top-0 z-50">
      <div className="bj-container">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3v">
            <div className="w-10 h-10 bg-bj-green rounded-full flex items-center justify-center text-white font-bold text-sm">
              MO
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">Mon Orientation</div>
              <div className="text-xs text-bj-gray-500">République du Bénin</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6v">
            <Link href="/catalogue" className="text-sm font-medium hover:text-bj-green transition-colors">
              Catalogue
            </Link>
            <Link href="/conseiller" className="text-sm font-medium hover:text-bj-green transition-colors">
              Conseiller IA
            </Link>
            <Link href="/espace-apprenant" className="text-sm font-medium hover:text-bj-green transition-colors">
              Mon espace
            </Link>
            <Link href="/connexion" className="bj-btn bj-btn-primary text-sm">
              Connexion
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2v"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="md:hidden pb-4v border-t border-bj-gray-925">
            <div className="flex flex-col gap-2v pt-4v">
              <Link href="/catalogue" className="text-sm font-medium py-2v hover:text-bj-green" onClick={() => setMenuOpen(false)}>
                Catalogue
              </Link>
              <Link href="/conseiller" className="text-sm font-medium py-2v hover:text-bj-green" onClick={() => setMenuOpen(false)}>
                Conseiller IA
              </Link>
              <Link href="/espace-apprenant" className="text-sm font-medium py-2v hover:text-bj-green" onClick={() => setMenuOpen(false)}>
                Mon espace
              </Link>
              <Link href="/connexion" className="bj-btn bj-btn-primary text-sm mt-2v" onClick={() => setMenuOpen(false)}>
                Connexion
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
