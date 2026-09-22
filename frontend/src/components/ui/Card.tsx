import type { ElementType, HTMLAttributes, ReactNode } from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const CLASSE_PADDING: Record<CardPadding, string> = { none: '', sm: 'p-4v', md: 'p-6v', lg: 'p-8v' };

interface CardOwnProps {
  /** Élément HTML rendu : 'article' pour une fiche autonome, 'section' pour un bloc de page, 'div' par défaut. */
  as?: ElementType;
  padding?: CardPadding;
  /** Lève la card au survol (à utiliser uniquement si la card entière est cliquable, ex. un Link englobant). */
  hoverable?: boolean;
  className?: string;
  children: ReactNode;
}

export type CardProps = CardOwnProps & Omit<HTMLAttributes<HTMLElement>, keyof CardOwnProps>;

/**
 * Surface de base du design system : fond blanc, bordure, rayon et ombre de niveau 1 (voir --shadow-card).
 * Remplace le motif `bg-white rounded-bj-md border border-bj-gray-925` répété à la main dans plusieurs
 * pages. `Carte` (components/espace/ui.tsx) s'appuie dessus pour la variante avec titre + icône.
 */
export function Card({ as: Balise = 'div', padding = 'md', hoverable, className, children, ...props }: CardProps) {
  const classes = ['bj-card', hoverable ? 'bj-card-hoverable' : '', CLASSE_PADDING[padding], className].filter(Boolean).join(' ');
  return (
    <Balise className={classes} {...props}>
      {children}
    </Balise>
  );
}
