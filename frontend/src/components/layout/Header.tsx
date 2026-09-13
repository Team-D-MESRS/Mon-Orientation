'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore, type Role } from '@/stores/authStore';

const LIENS: { href: string; label: string; roles?: Role[] }[] = [
  { href: '/catalogue', label: 'Catalogue' },
  { href: '/conseiller', label: 'Conseiller IA' },
  { href: '/espace-apprenant', label: 'Mon espace', roles: ['APPRENANT', 'PARENT', 'ADMIN'] },
  { href: '/stats', label: 'Statistiques', roles: ['DGES', 'ADMIN'] },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deconnexionEnCours, setDeconnexionEnCours] = useState(false);

  // Un visiteur voit « Mon espace », qui le mène à la connexion
  const liens = LIENS.filter((l) => !l.roles || (user ? l.roles.includes(user.role) : l.href === '/espace-apprenant'));

  const deconnecter = async () => {
    await authApi.logout().catch(() => undefined);
    setMenuOpen(false);
    setDeconnexionEnCours(true);
    router.push('/');
  };

  // La session locale n'est effacée qu'une fois sur l'accueil : effacée plus tôt, la page protégée
  // encore affichée redirigerait vers /connexion au lieu de laisser la navigation aboutir.
  useEffect(() => {
    if (deconnexionEnCours && pathname === '/') {
      logout();
      setDeconnexionEnCours(false);
    }
  }, [deconnexionEnCours, pathname, logout]);

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
            {liens.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-medium hover:text-bj-green transition-colors">
                {l.label}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center gap-3v">
                <span className="text-sm text-bj-gray-500">{user.prenom}</span>
                <button type="button" onClick={deconnecter} className="bj-btn bj-btn-secondary text-sm inline-flex items-center gap-2v">
                  <LogOut size={16} aria-hidden="true" /> Déconnexion
                </button>
              </div>
            ) : (
              <Link href="/connexion" className="bj-btn bj-btn-primary text-sm">
                Connexion
              </Link>
            )}
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
              {liens.map((l) => (
                <Link key={l.href} href={l.href} className="text-sm font-medium py-2v hover:text-bj-green" onClick={() => setMenuOpen(false)}>
                  {l.label}
                </Link>
              ))}
              {user ? (
                <button type="button" onClick={deconnecter} className="bj-btn bj-btn-secondary text-sm mt-2v inline-flex items-center justify-center gap-2v">
                  <LogOut size={16} aria-hidden="true" /> Déconnexion ({user.prenom})
                </button>
              ) : (
                <Link href="/connexion" className="bj-btn bj-btn-primary text-sm mt-2v" onClick={() => setMenuOpen(false)}>
                  Connexion
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
