import type { Role, Utilisateur } from '@/stores/authStore';

/** Navigation principale, partagée par l'en-tête et le pied de page. */
const LIENS_PRINCIPAUX: { href: string; label: string; roles?: Role[] }[] = [
  { href: '/catalogue', label: 'Catalogue' },
  { href: '/conseiller', label: 'Conseiller IA' },
  { href: '/espace-apprenant', label: 'Mon espace', roles: ['APPRENANT', 'PARENT', 'ADMIN'] },
  { href: '/stats', label: 'Statistiques', roles: ['DGES', 'ADMIN'] },
];

/** Un visiteur voit « Mon espace », qui le mène à la connexion ; les statistiques restent réservées à la DGES et à l'admin. */
export const liensVisibles = (user: Utilisateur | null) =>
  LIENS_PRINCIPAUX.filter((l) => !l.roles || (user ? l.roles.includes(user.role) : l.href === '/espace-apprenant'));

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
