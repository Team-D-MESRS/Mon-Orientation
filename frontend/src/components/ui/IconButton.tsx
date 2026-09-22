'use client';

import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type IconButtonSize = 'sm' | 'md';

const CLASSE_VARIANTE: Record<IconButtonVariant, string> = {
  primary: 'bj-icon-btn-primary',
  secondary: 'bj-icon-btn-secondary',
  ghost: 'bj-icon-btn-ghost',
  danger: 'bj-icon-btn-danger',
};

interface IconButtonOwnProps {
  icon: ReactNode;
  /** Nom accessible obligatoire : un bouton icône seul n'a pas de texte pour se décrire. */
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  className?: string;
}

export type IconButtonProps = IconButtonOwnProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof IconButtonOwnProps | 'aria-label' | 'title'>;

/** Bouton carré, icône seule (fermer, supprimer, enregistrer une note vocale…). `label` sert d'aria-label et de title. */
export function IconButton({ icon, label, variant = 'ghost', size = 'md', loading, disabled, className, type = 'button', ...props }: IconButtonProps) {
  const classes = ['bj-icon-btn', CLASSE_VARIANTE[variant], size === 'sm' ? 'bj-icon-btn-sm' : '', className].filter(Boolean).join(' ');
  return (
    <button type={type} aria-label={label} title={label} disabled={disabled || loading} aria-busy={loading || undefined} className={classes} {...props}>
      {loading ? <Loader2 size={size === 'sm' ? 14 : 16} className="spinner" aria-hidden="true" /> : icon}
    </button>
  );
}
