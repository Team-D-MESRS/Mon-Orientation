'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button, ButtonLink } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { estLienActif, liensVisibles, ROLE_LABELS } from './navigation';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deconnexionEnCours, setDeconnexionEnCours] = useState(false);

  const liens = liensVisibles(user);
  // Un compte ADMIN voit les 5 liens (Catalogue, Guido, Mon espace, Statistiques, Administration) au lieu des
  // 2-3 du tronc commun : passés le seuil habituel (md, 768px), un petit ordinateur portable (~1024px) n'a
  // plus assez de place pour 5 liens + logo + profil + déconnexion sur une ligne — la navigation desktop
  // bascule alors plus tard (lg, 1024px) dans ce cas, plutôt que de laisser le contenu déborder ou se replier
  // sur deux lignes. Générée en chaînes Tailwind complètes (pas de préfixe interpolé) : le compilateur ne
  // reconnaît que des noms de classe littéraux dans le code source.
  const seuilDesktopEtroit = liens.length > 3;

  const deconnecter = async () => {
    await authApi.logout().catch(() => undefined);
    setMenuOpen(false);
    setDeconnexionEnCours(true);
    router.push('/');
  };

  // La session locale n'est effacée qu'une fois sur l'accueil : effacée plus tôt, la page protégée
  // encore affichée redirigerait vers /identification au lieu de laisser la navigation aboutir.
  useEffect(() => {
    if (deconnexionEnCours && pathname === '/') {
      logout();
      setDeconnexionEnCours(false);
    }
  }, [deconnexionEnCours, pathname, logout]);

  // Ferme le menu mobile à chaque changement de page (ex. lien ouvert par le clavier, bouton retour) :
  // sans ça, il resterait ouvert par-dessus la page suivante.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Échap referme le menu mobile : sans ce raccourci, le seul moyen de le fermer au clavier est de retabuler
  // jusqu'au bouton bascule et de valider — peu naturel pour un menu qui se comporte comme un panneau ouvert.
  useEffect(() => {
    if (!menuOpen) return;
    const surEchap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', surEchap);
    return () => document.removeEventListener('keydown', surEchap);
  }, [menuOpen]);

  return (
    <header className="bj-header sticky top-0 z-50 print:hidden">
      <div className="bj-container">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3v shrink-0">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-text-on-primary font-bold text-sm shrink-0">
              MO
            </div>
            <div className="hidden sm:block">
              <div className="font-serif font-bold text-base leading-tight">Mon Orientation</div>
              <div className="text-xs text-text-secondary">République du Bénin</div>
            </div>
          </Link>

          {/* Desktop nav : gap resserré tant que le rôle (Administration, DGES…) ajoute des liens en plus du
              tronc commun — sans quoi un intitulé à deux mots (« Mon espace ») pouvait se replier sur deux
              lignes juste après le seuil md, le temps que la ligne retrouve assez de place (whitespace-nowrap
              en filet de sécurité, mais la vraie correction est de faire tenir la ligne). */}
          <nav
            aria-label="Navigation principale"
            className={`${seuilDesktopEtroit ? 'hidden lg:flex' : 'hidden md:flex'} items-center gap-3v lg:gap-6v`}
          >
            {liens.map((l) => {
              const actif = estLienActif(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={actif ? 'page' : undefined}
                  className={`nav-link text-sm font-medium whitespace-nowrap transition-colors ${actif ? 'text-primary font-semibold' : 'hover:text-primary'}`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className={`${seuilDesktopEtroit ? 'hidden lg:flex' : 'hidden md:flex'} items-center gap-2v lg:gap-3v shrink-0`}>
            {user ? (
              <>
                {/* Accès profil : identité + rôle, toujours visible (pas de menu à ouvrir pour voir qui est connecté).
                    Le rôle texte (« Administrateur », « Conseiller DGES »…) n'apparaît qu'à partir de lg : entre
                    md et lg, seuls avatar + prénom suffisent à s'identifier, et libèrent la place qui manquait
                    pour les rôles avec plusieurs liens de navigation en plus. */}
                <div className="flex items-center gap-2v" aria-label={`Connecté en tant que ${user.prenom} ${user.nom}, ${ROLE_LABELS[user.role]}`}>
                  <span className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center text-xs font-bold shrink-0" aria-hidden="true">
                    {`${user.prenom[0] ?? ''}${user.nom[0] ?? ''}`.toUpperCase()}
                  </span>
                  <span className="leading-tight whitespace-nowrap">
                    <span className="block text-sm font-medium">{user.prenom}</span>
                    <span className="hidden lg:block text-xs text-text-secondary">{ROLE_LABELS[user.role]}</span>
                  </span>
                </div>
                <Button variant="secondary" size="sm" icon={<LogOut size={16} aria-hidden="true" />} onClick={deconnecter}>
                  Déconnexion
                </Button>
              </>
            ) : (
              <ButtonLink href="/identification" size="sm">
                S&apos;identifier
              </ButtonLink>
            )}
          </div>

          {/* Mobile menu button */}
          <IconButton
            className={seuilDesktopEtroit ? 'lg:hidden' : 'md:hidden'}
            icon={menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            onClick={() => setMenuOpen(!menuOpen)}
          />
        </div>

        {/* Mobile nav : tout est visible directement, rien de caché derrière un sous-menu */}
        {menuOpen && (
          <nav
            id="menu-mobile"
            aria-label="Navigation principale"
            className={`${seuilDesktopEtroit ? 'lg:hidden' : 'md:hidden'} pb-4v border-t border-border`}
          >
            <div className="flex flex-col gap-1v pt-4v">
              {liens.map((l) => {
                const actif = estLienActif(pathname, l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={actif ? 'page' : undefined}
                    className={`rounded-bj-sm px-3v py-3v text-sm font-medium transition-colors ${
                      actif ? 'bg-primary-soft text-primary font-semibold' : 'hover:bg-surface-sunken'
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>
            {user ? (
              <div className="mt-3v pt-3v border-t border-border">
                <p className="px-3v text-sm font-medium">
                  {user.prenom} {user.nom}
                </p>
                <p className="px-3v text-xs text-text-secondary mb-3v">{ROLE_LABELS[user.role]}</p>
                <Button variant="secondary" size="sm" fullWidth icon={<LogOut size={16} aria-hidden="true" />} onClick={deconnecter}>
                  Déconnexion
                </Button>
              </div>
            ) : (
              <ButtonLink href="/identification" size="sm" fullWidth className="mt-3v">
                S&apos;identifier
              </ButtonLink>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
