import type { ReactNode } from 'react';
import { AlertTriangle, ChevronDown, ExternalLink } from 'lucide-react';

/** Titre de page, introduction et date de mise à jour. */
export function EnTete({ titre, intro, miseAJour }: { titre: string; intro?: ReactNode; miseAJour?: string }) {
  return (
    <div className="mb-8v">
      <h1 className="text-3xl font-bold mb-3v">{titre}</h1>
      {intro && <p className="text-lg text-bj-gray-500">{intro}</p>}
      {miseAJour && <p className="text-xs text-bj-gray-500 mt-3v">Mise à jour : {miseAJour}</p>}
    </div>
  );
}

/** Section de texte : titres h2, listes à puces et liens soulignés. */
export function Bloc({ id, titre, children }: { id?: string; titre: string; children: ReactNode }) {
  return (
    <section id={id} className="mb-8v scroll-mt-24 break-inside-avoid">
      <h2 className="text-xl font-bold mb-3v">{titre}</h2>
      <div className="space-y-3v text-bj-gray-200 leading-relaxed [&_ul]:list-disc [&_ul]:pl-6v [&_ul]:space-y-1v [&_a]:font-medium [&_a]:text-bj-green [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </section>
  );
}

/** Information officielle pas encore communiquée : signalée plutôt qu'inventée. */
export function ACompleter({ children = 'Information à communiquer par le Ministère.' }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-start gap-2v px-3v py-2v rounded-bj-sm border border-bj-ochre/40 bg-bj-ochre/10 text-sm text-bj-ochre-fonce">
      <AlertTriangle size={16} className="shrink-0 mt-[2px]" aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}

/** Bandeau des documents à valider par le Ministère avant la mise en ligne. */
export function Provisoire({ children }: { children: ReactNode }) {
  return (
    <div role="note" className="flex gap-3v items-start p-4v mb-8v rounded-bj-sm border border-bj-ochre/40 bg-bj-ochre/10 text-sm">
      <AlertTriangle className="text-bj-ochre-fonce shrink-0 mt-[2px]" size={18} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

export function LienExterne({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1v">
      {children}
      <ExternalLink size={14} aria-hidden="true" />
      <span className="sr-only">(nouvel onglet)</span>
    </a>
  );
}

/** Question dépliable (élément natif details/summary : clavier et lecteurs d'écran sans script). */
export function Question({ question, children }: { question: string; children: ReactNode }) {
  return (
    <details className="group border-b border-bj-gray-925 py-4v">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4v font-medium rounded-bj-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-bj-green [&::-webkit-details-marker]:hidden">
        {question}
        <ChevronDown size={18} className="shrink-0 mt-[2px] text-bj-green transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="mt-3v space-y-2v text-bj-gray-200 leading-relaxed [&_a]:font-medium [&_a]:text-bj-green [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </details>
  );
}
