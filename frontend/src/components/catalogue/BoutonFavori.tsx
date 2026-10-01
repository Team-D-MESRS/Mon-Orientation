'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import type { Filiere } from '@/lib/filiere';
import { useFavoris } from '@/stores/favorisStore';
import { IconButton } from '@/components/ui/IconButton';

/** Cœur « Mettre en favoris » : réservé aux élèves connectés, retrouvé lors de la saisie des vœux. */
export function BoutonFavori({ filiere, compact = false }: { filiere: Filiere; compact?: boolean }) {
  const { actif, pret, estFavori, basculer } = useFavoris();
  // Rebond uniquement au moment où on VIENT de mettre en favoris (pas à chaque rendu où favori=true, ce
  // qui le rejouerait à chaque fois qu'on retrouve une formation déjà en favoris sur une autre page).
  const [rebond, setRebond] = useState(false);
  if (!actif) return null;
  const favori = estFavori(filiere.id);
  const libelle = favori ? `Retirer ${filiere.nom} de mes favoris` : `Mettre ${filiere.nom} en favoris pour mes vœux`;

  const gererClic = () => {
    if (!favori) setRebond(true);
    basculer(filiere);
  };

  if (compact) {
    return (
      <IconButton
        icon={
          <Heart
            size={18}
            aria-hidden="true"
            fill={favori ? 'currentColor' : 'none'}
            className={rebond ? 'pop-feedback' : ''}
            onAnimationEnd={() => setRebond(false)}
          />
        }
        label={libelle}
        variant="ghost"
        disabled={!pret}
        onClick={gererClic}
        className={favori ? '!text-danger' : ''}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={gererClic}
      disabled={!pret}
      aria-pressed={favori}
      title={favori ? 'Dans mes favoris : clique pour la retirer' : 'Mettre en favoris pour mes vœux'}
      className={`inline-flex items-center gap-1v px-3v py-2v border rounded-bj-sm text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 ${
        favori ? 'text-danger border-danger/40 bg-danger-soft' : 'text-text border-border-strong bg-surface hover:text-danger'
      }`}
    >
      <Heart
        size={16}
        aria-hidden="true"
        fill={favori ? 'currentColor' : 'none'}
        className={rebond ? 'pop-feedback' : ''}
        onAnimationEnd={() => setRebond(false)}
      />
      Mettre en favoris
    </button>
  );
}
