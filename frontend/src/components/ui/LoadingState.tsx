interface LoadingStateProps {
  text?: string;
  className?: string;
}

/** Attente courte en ligne (chargement d'une section) : point qui pulse + texte, respecte prefers-reduced-motion. */
export function LoadingState({ text = 'Chargement…', className }: LoadingStateProps) {
  return (
    <p className={`py-8v text-center text-text-secondary loading-pulse ${className ?? ''}`} aria-busy="true" role="status">
      <span className="inline-flex items-center gap-2v">
        <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
        {text}
      </span>
    </p>
  );
}

interface SkeletonGridProps {
  count?: number;
  /** Classe de la grille (par défaut : 1/2/3 colonnes comme le catalogue) */
  className?: string;
  itemClassName?: string;
  label?: string;
}

/** Grille de silhouettes en attente (catalogue, listes de cards) : remplace les `Array.from({length:6}).map(...)` dupliqués. */
export function SkeletonGrid({ count = 6, className, itemClassName, label = 'Chargement du contenu' }: SkeletonGridProps) {
  return (
    <div className={className ?? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6v'} aria-busy="true" aria-label={label}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={itemClassName ?? 'h-56 rounded-bj-md bg-surface-sunken skeleton-pulse'} />
      ))}
    </div>
  );
}
