import type { Role, Utilisateur } from '@/stores/authStore';

/** Navigation principale, partagée par l'en-tête et le pied de page. */
const LIENS_PRINCIPAUX: { href: string; label: string; roles?: Role[] }[] = [
  { href: '/catalogue', label: 'Catalogue' },
  { href: '/conseiller', label: 'Guido' },
  { href: '/espace-apprenant', label: 'Mon espace', roles: ['APPRENANT', 'PARENT', 'ADMIN'] },
  { href: '/stats', label: 'Statistiques', roles: ['DGES', 'ADMIN'] },
  { href: '/admin', label: 'Administration', roles: ['ADMIN'] },
];

/** Un visiteur voit « Mon espace », qui le mène à la connexion ; les statistiques restent réservées à la DGES et à l'admin. */
export const liensVisibles = (user: Utilisateur | null) =>
  LIENS_PRINCIPAUX.filter((l) => !l.roles || (user ? l.roles.includes(user.role) : l.href === '/espace-apprenant'));

/**
 * Un lien de navigation est actif sur sa page et sur toutes ses sous-pages (ex. `/catalogue` reste actif
 * sur `/catalogue/abc-123` et `/catalogue/comparer`) — pas seulement en correspondance exacte, sans quoi
 * l'en-tête perdrait la trace du rayon courant dès qu'on descend d'un niveau. `/` est un cas particulier
 * (préfixe de tout) : seule une égalité stricte le rend actif.
 */
export const estLienActif = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

/** Libellé du rôle affiché dans l'accès profil de l'en-tête. */
export const ROLE_LABELS: Record<Role, string> = {
  APPRENANT: 'Élève',
  PARENT: 'Parent',
  ETABLISSEMENT: 'Établissement',
  DGES: 'Conseiller DGES',
  ADMIN: 'Administrateur',
};

export const PAGES_AIDE = [
  { href: '/guide', label: "Guide d'utilisation" },
  { href: '/faq', label: 'Questions fréquentes' },
  { href: '/contact', label: 'Contact' },
];

export const PAGES_LEGALES = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/donnees-personnelles', label: 'Données personnelles' },
  { href: '/accessibilite', label: 'Accessibilité' },
];

export const PAGES_INFORMATION = [...PAGES_AIDE, ...PAGES_LEGALES];
