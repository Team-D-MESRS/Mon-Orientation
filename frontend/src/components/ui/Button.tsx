'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ComponentProps, MouseEvent, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const CLASSE_TAILLE: Record<ButtonSize, string> = { sm: 'bj-btn-sm', md: '', lg: 'bj-btn-lg' };
const CLASSE_VARIANTE: Record<ButtonVariant, string> = {
  primary: 'bj-btn-primary',
  secondary: 'bj-btn-secondary',
  ghost: 'bj-btn-ghost',
  danger: 'bj-btn-danger',
};

function classesBouton(variant: ButtonVariant, size: ButtonSize, fullWidth: boolean | undefined, className: string | undefined) {
  return ['bj-btn', CLASSE_VARIANTE[variant], CLASSE_TAILLE[size], fullWidth ? 'w-full' : '', className].filter(Boolean).join(' ');
}

interface ButtonContentProps {
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  children: ReactNode;
}

function ButtonContent({ icon, iconRight, loading, children }: ButtonContentProps) {
  return (
    <>
      {loading ? <Loader2 size={16} className="spinner shrink-0" aria-hidden="true" /> : icon}
      <span>{children}</span>
      {!loading && iconRight}
    </>
  );
}

interface ButtonOwnProps extends ButtonContentProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

export type ButtonProps = ButtonOwnProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps>;

/**
 * Bouton d'action : `primary` pour l'action principale d'un écran, `secondary` pour une action
 * alternative, `ghost` pour une action discrète (proche d'un lien, sans contour), `danger` pour une action
 * qui supprime ou annule quelque chose sans retour possible — jamais pour une action de routine comme se
 * déconnecter. Remplace les `<button className="bj-btn bj-btn-primary ...">` posés à la main page par page.
 */
export function Button({ variant = 'primary', size = 'md', icon, iconRight, loading, fullWidth, className, children, disabled, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classesBouton(variant, size, fullWidth, className)}
      {...props}
    >
      <ButtonContent icon={icon} iconRight={iconRight} loading={loading}>
        {children}
      </ButtonContent>
    </button>
  );
}

interface ButtonLinkOwnProps extends ButtonContentProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  href: string;
  /** Un lien ne peut pas porter l'attribut HTML `disabled` : le clic et le clavier sont neutralisés à la place. */
  disabled?: boolean;
}

export type ButtonLinkProps = ButtonLinkOwnProps & Omit<ComponentProps<typeof Link>, keyof ButtonLinkOwnProps>;

/** Même apparence que Button, pour une navigation (Link Next.js) plutôt qu'une action. */
export function ButtonLink({ variant = 'primary', size = 'md', icon, iconRight, loading, fullWidth, className, children, href, disabled, onClick, ...props }: ButtonLinkProps) {
  const desactive = disabled || loading;
  return (
    <Link
      href={href}
      aria-disabled={desactive || undefined}
      aria-busy={loading || undefined}
      tabIndex={desactive ? -1 : undefined}
      onClick={desactive ? (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault() : onClick}
      className={`${classesBouton(variant, size, fullWidth, className)} ${desactive ? 'pointer-events-none' : ''}`}
      {...props}
    >
      <ButtonContent icon={icon} iconRight={iconRight} loading={loading}>
        {children}
      </ButtonContent>
    </Link>
  );
}
