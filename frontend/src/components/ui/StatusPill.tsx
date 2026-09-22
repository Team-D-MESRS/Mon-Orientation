import type { ReactNode } from 'react';
import { TONS, type Ton } from './tons';

interface StatusPillProps {
  ton: Ton;
  children: ReactNode;
  className?: string;
}

/** Indicateur d'état (« Validés », « À relire », « API ok »…) : puce pleine + libellé teinté. */
export function StatusPill({ ton, children, className }: StatusPillProps) {
  const t = TONS[ton];
  return (
    <span className={`inline-flex items-center gap-2v px-3v py-1v rounded-full text-xs font-semibold ${t.fond} ${t.texte} ${className ?? ''}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${t.point}`} aria-hidden="true" />
      {children}
    </span>
  );
}
