/**
 * Bibliothèque de composants UI génériques (indépendants du métier « orientation scolaire »). Les
 * composants qui en ont besoin — Carte, Alerte, BadgeType, Chargement, CHAMP, PastilleRang — restent
 * exportés par components/espace/ui.tsx, construits au-dessus de ceux-ci, pour ne pas casser les imports
 * existants dans le reste de l'application.
 */
export * from './tons';
export * from './Button';
export * from './IconButton';
export * from './Card';
export * from './Badge';
export * from './StatusPill';
export * from './SectionHeader';
export * from './EmptyState';
export * from './LoadingState';
export * from './ProgressBar';
export * from './Breadcrumb';
export * from './StatCard';
export * from './ActionCard';
export * from './Tabs';
