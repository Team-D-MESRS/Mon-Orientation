'use client';

import { ArrowLeftRight } from 'lucide-react';
import type { Filiere } from '@/lib/filiere';
import { useComparateur } from '@/stores/comparateurStore';

export function BoutonComparer({ filiere, avecBordure = false }: { filiere: Pick<Filiere, 'id' | 'nom'>; avecBordure?: boolean }) {
  const choisie = useComparateur((s) => s.selection.some((f) => f.id === filiere.id));
  const basculer = useComparateur((s) => s.basculer);

  return (
    <button
      type="button"
      onClick={() => basculer({ id: filiere.id, nom: filiere.nom })}
      aria-pressed={choisie}
      className={`inline-flex items-center gap-1v rounded-bj-sm text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bj-green ${
        avecBordure ? 'px-3v py-2v border' : 'px-2v py-2v'
      } ${choisie ? 'text-bj-green border-bj-green bg-bj-green/10' : 'text-bj-gray-200 border-bj-gray-850 bg-white hover:text-bj-green'}`}
    >
      <ArrowLeftRight size={16} aria-hidden="true" />
      Comparer<span className="sr-only"> : {filiere.nom}</span>
    </button>
  );
}
