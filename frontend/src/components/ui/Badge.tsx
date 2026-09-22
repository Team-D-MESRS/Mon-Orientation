import type { ReactNode } from 'react';
import { TONS, type Ton } from './tons';

export type BadgeVariant = 'soft' | 'solid' | 'outline';

interface BadgeProps {
  ton?: Ton;
  variant?: BadgeVariant;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Étiquette catégorielle courte (type de formation, statut, « Nouveau »…). Remplace les pastilles de couleur codées en dur page par page. */
export function Badge({ ton = 'neutre', variant = 'soft', icon, className, children }: BadgeProps) {
  const t = TONS[ton];
  const couleurs = variant === 'solid' ? t.plein : variant === 'outline' ? `bg-surface border ${t.bordure} ${t.texte}` : `${t.fond} ${t.texte}`;
  return (
    <span className={`inline-flex items-center gap-1v px-3v py-1v rounded-full text-xs font-medium ${couleurs} ${className ?? ''}`}>
      {icon}
      {children}
    </span>
  );
}
