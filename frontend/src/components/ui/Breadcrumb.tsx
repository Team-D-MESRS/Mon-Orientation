import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Crumb {
  label: string;
  /** Absent sur le dernier élément : page courante, pas un lien */
  href?: string;
}

interface BreadcrumbProps {
  items: Crumb[];
  className?: string;
}

/** Fil d'Ariane. Utilisé sur les pages profondes du catalogue (fiche filière, comparateur) à la place du seul lien « ← Retour ». */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Fil d'Ariane" className={`text-sm text-text-secondary print:hidden ${className ?? ''}`}>
      <ol className="flex items-center flex-wrap gap-1v">
        {items.map((item, i) => {
          const dernier = i === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1v min-w-0">
              {i > 0 && <ChevronRight size={14} className="text-text-muted shrink-0" aria-hidden="true" />}
              {item.href && !dernier ? (
                <Link href={item.href} className="hover:text-primary hover:underline truncate">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={dernier ? 'page' : undefined} className={`truncate ${dernier ? 'text-text font-medium' : ''}`}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
