import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

export type ActionCardVariant = 'default' | 'compact' | 'primary';

interface ActionCardProps {
  href: string;
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actionLabel?: string;
  /** 'default' : card illustrée (accueil). 'compact' : ligne titre + détail (admin). 'primary' : CTA plein, fond de marque (« prochaine étape »). */
  variant?: ActionCardVariant;
  className?: string;
}

/** Card cliquable entière (Link), avec flèche indiquant la navigation. Consolide les 3 usages déjà présents dans le code. */
export function ActionCard({ href, icon, eyebrow, title, description, actionLabel, variant = 'default', className }: ActionCardProps) {
  if (variant === 'primary') {
    return (
      <Link
        href={href}
        className={`group inline-flex items-center justify-between gap-4v rounded-bj-sm bg-primary px-4v py-3v text-text-on-primary shadow-sm transition hover:bg-primary-strong hover:shadow-card-hover focus-visible:outline-white ${className ?? ''}`}
      >
        <span>
          {eyebrow && <span className="block text-xs text-white/75">{eyebrow}</span>}
          <span className="block font-semibold">{title}</span>
          {description && <span className="block text-xs text-white/80 mt-1v max-w-[16rem]">{description}</span>}
        </span>
        <ArrowRight size={19} className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link
        href={href}
        className={`group flex items-center justify-between gap-3v rounded-bj-sm border border-border p-3v transition-colors hover:border-primary ${className ?? ''}`}
      >
        <span className="min-w-0">
          <span className="block font-medium">{title}</span>
          {description && <span className="block text-sm text-text-secondary mt-1v">{description}</span>}
        </span>
        <ArrowRight size={16} className="shrink-0 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <Link href={href} className={`bj-card bj-card-hoverable flex flex-col h-full p-6v group ${className ?? ''}`}>
      {icon && <span className="w-12 h-12 rounded-full bg-primary text-text-on-primary flex items-center justify-center mb-4v">{icon}</span>}
      {eyebrow && <span className="text-xs font-semibold uppercase tracking-wide text-primary mb-1v">{eyebrow}</span>}
      <span className="text-lg font-bold mb-2v">{title}</span>
      {description && <span className="text-sm text-text-secondary flex-1 mb-4v">{description}</span>}
      {actionLabel && (
        <span className="inline-flex items-center gap-1v text-sm font-medium text-primary group-hover:underline">
          {actionLabel} <ArrowRight size={14} aria-hidden="true" />
        </span>
      )}
    </Link>
  );
}
