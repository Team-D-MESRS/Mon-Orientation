'use client';

import { Heart } from 'lucide-react';
import type { Filiere } from '@/lib/filiere';
import { useFavoris } from '@/stores/favorisStore';

/** Cœur « Mettre de côté » : réservé aux élèves connectés, retrouvé lors de la saisie des vœux. */
export function BoutonFavori({ filiere, compact = false }: { filiere: Filiere; compact?: boolean }) {
  const { actif, pret, estFavori, basculer } = useFavoris();
  if (!actif) return null;
  const favori = estFavori(filiere.id);

  return (
    <button
      type="button"
      onClick={() => basculer(filiere)}
      disabled={!pret}
      aria-pressed={favori}
      title={favori ? 'Mise de côté : clique pour la retirer' : 'Mettre de côté pour mes vœux'}
      className={`inline-flex items-center gap-1v rounded-bj-sm text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bj-green disabled:opacity-50 ${
        compact ? 'p-2v' : 'px-3v py-2v border'
      } ${favori ? 'text-bj-red border-bj-red/40 bg-bj-red/5' : 'text-bj-gray-200 border-bj-gray-850 bg-white hover:text-bj-red'}`}
    >
      <Heart size={compact ? 18 : 16} aria-hidden="true" fill={favori ? 'currentColor' : 'none'} />
      {compact ? <span className="sr-only">Mettre de côté : {filiere.nom}</span> : 'Mettre de côté'}
    </button>
  );
}
