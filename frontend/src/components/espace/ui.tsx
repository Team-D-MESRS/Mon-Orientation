import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { TYPE_COLORS, TYPE_LABELS, type TypeFiliere } from '@/lib/filiere';

export const CHAMP =
  'w-full px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-bj-green';

export function Chargement({ texte = 'Chargement…' }: { texte?: string }) {
  return (
    <p className="py-8v text-center text-bj-gray-500 loading-pulse" aria-busy="true" role="status">
      <span className="inline-flex items-center gap-2v"><span className="w-2 h-2 rounded-full bg-bj-green" aria-hidden="true" />{texte}</span>
    </p>
  );
}

const TONS = {
  info: { role: 'note', classes: 'border-bj-blue/30 bg-bj-blue/5', Icone: Info, couleur: 'text-bj-blue' },
  succes: { role: 'status', classes: 'border-bj-green/30 bg-bj-green/5', Icone: CheckCircle2, couleur: 'text-bj-green' },
  attention: { role: 'note', classes: 'border-bj-ochre/40 bg-bj-ochre/10', Icone: AlertTriangle, couleur: 'text-bj-ochre-fonce' },
  erreur: { role: 'alert', classes: 'border-bj-red/40 bg-bj-red/5', Icone: XCircle, couleur: 'text-bj-red' },
} as const;

export function Alerte({ ton, children }: { ton: keyof typeof TONS; children: ReactNode }) {
  const { role, classes, Icone, couleur } = TONS[ton];
  return (
    <div role={role} className={`flex gap-3v items-start p-4v my-4v rounded-bj-sm border text-sm page-enter ${classes}`}>
      <Icone size={18} className={`shrink-0 mt-[2px] ${couleur}`} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function BadgeType({ type }: { type: TypeFiliere }) {
  return (
    <span className={`inline-block px-3v py-1v rounded-full text-xs font-medium ${TYPE_COLORS[type]}`}>
      {TYPE_LABELS[type]}
    </span>
  );
}

export function Carte({ titre, icone, children }: { titre: string; icone: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white rounded-bj-md border border-bj-gray-925 p-6v transition-shadow duration-200 hover:shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
      <h2 className="flex items-center gap-2v text-sm font-bold uppercase tracking-wide text-bj-gray-500 mb-4v">
        <span className="text-bj-green" aria-hidden="true">{icone}</span>
        {titre}
      </h2>
      {children}
    </section>
  );
}

export function PastilleRang({ rang }: { rang: number }) {
  return (
    <span className="w-8 h-8 rounded-full bg-bj-green text-white flex items-center justify-center font-bold shrink-0" aria-hidden="true">
      {rang}
    </span>
  );
}
