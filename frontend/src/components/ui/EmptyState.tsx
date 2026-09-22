import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** État vide homogène (« Aucune formation mise de côté », « Aucune recommandation »…) : icône, message, action optionnelle. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center text-center gap-2v py-10v px-6v rounded-bj-md border border-dashed border-border-strong bg-surface-sunken/60 ${className ?? ''}`}>
      {icon && (
        <span className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-text-muted mb-1v" aria-hidden="true">
          {icon}
        </span>
      )}
      <p className="font-semibold">{title}</p>
      {description && <p className="text-sm text-text-secondary max-w-sm">{description}</p>}
      {action && <div className="mt-3v">{action}</div>}
    </div>
  );
}
