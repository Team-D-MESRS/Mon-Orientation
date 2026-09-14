'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { MAX_COMPARAISON } from '@/lib/filiere';
import { restaurerComparateur, useComparateur } from '@/stores/comparateurStore';

/** Barre fixée en bas de l'écran tant qu'au moins une formation est choisie pour la comparaison. */
export function BarreComparateur() {
  const pathname = usePathname();
  const { selection, alerte, retirer, vider } = useComparateur();
  const [restauree, setRestauree] = useState(false);
  const barre = useRef<HTMLDivElement>(null);

  useEffect(() => {
    restaurerComparateur().finally(() => setRestauree(true));
  }, []);

  const visible = restauree && selection.length > 0 && pathname !== '/catalogue/comparer';

  // La barre ne doit pas masquer le bas de la page : on réserve sa hauteur sous le contenu
  useEffect(() => {
    const element = barre.current;
    if (!visible || !element) return;
    const observateur = new ResizeObserver(() => {
      document.body.style.paddingBottom = `${element.offsetHeight}px`;
    });
    observateur.observe(element);
    return () => {
      observateur.disconnect();
      document.body.style.paddingBottom = '';
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={barre}
      role="region"
      aria-label="Comparateur de formations"
      className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-bj-gray-925 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] print:hidden"
    >
      <div className="bj-container py-3v flex flex-col md:flex-row md:items-center gap-3v">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">
            {selection.length} formation{selection.length > 1 ? 's' : ''} à comparer{' '}
            <span className="font-normal text-bj-gray-500">({MAX_COMPARAISON} au maximum)</span>
          </p>
          <ul className="hidden md:flex flex-wrap gap-2v mt-1v">
            {selection.map((f) => (
              <li key={f.id} className="inline-flex items-center gap-1v max-w-xs pl-3v pr-1v py-1v rounded-full bg-bj-gray-975 border border-bj-gray-925 text-xs">
                <span className="truncate">{f.nom}</span>
                <button
                  type="button"
                  onClick={() => retirer(f.id)}
                  className="p-1v rounded-full hover:bg-bj-gray-925"
                  aria-label={`Retirer ${f.nom} de la comparaison`}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          {alerte && (
            <p role="alert" className="text-xs font-medium text-bj-ochre-fonce mt-1v">
              {alerte}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2v shrink-0">
          <button type="button" onClick={vider} className="bj-btn bj-btn-secondary text-sm">
            Vider
          </button>
          {selection.length >= 2 ? (
            <Link href={`/catalogue/comparer?ids=${selection.map((f) => f.id).join(',')}`} className="bj-btn bj-btn-primary text-sm">
              Comparer →
            </Link>
          ) : (
            <span className="text-sm text-bj-gray-500">Choisis au moins 2 formations</span>
          )}
        </div>
      </div>
    </div>
  );
}
