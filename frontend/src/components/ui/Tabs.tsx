import { useRef } from 'react';

interface TabsProps<T extends string> {
  items: { cle: T; label: string }[];
  actif: T;
  onChange: (cle: T) => void;
  /** Préfixe des id générés pour relier chaque onglet à son panneau (aria-controls / id du panneau). */
  idBase: string;
  className?: string;
}

/**
 * Liste d'onglets accessible (role="tablist"/"tab", flèches gauche/droite pour naviguer, défilement
 * horizontal sur mobile — même motif que la nav de CadreEspace). Ne rend que les boutons : le panneau
 * associé à l'onglet actif reste à la charge de l'appelant (un seul affiché à la fois, par ex. via
 * `{actif === 'X' && <div id={`${idBase}-X`} role="tabpanel" aria-labelledby={`${idBase}-X-onglet`}>…</div>}`).
 */
export function Tabs<T extends string>({ items, actif, onChange, idBase, className }: TabsProps<T>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const surClavier = (e: React.KeyboardEvent, index: number) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const suivant = items[(index + delta + items.length) % items.length];
    onChange(suivant.cle);
    refs.current[suivant.cle]?.focus();
  };

  return (
    <div role="tablist" aria-label="Années et examens" className={`flex gap-2v overflow-x-auto pb-1v ${className ?? ''}`}>
      {items.map((item, index) => {
        const estActif = item.cle === actif;
        return (
          <button
            key={item.cle}
            ref={(el) => {
              refs.current[item.cle] = el;
            }}
            type="button"
            role="tab"
            id={`${idBase}-${item.cle}-onglet`}
            aria-selected={estActif}
            aria-controls={`${idBase}-${item.cle}`}
            tabIndex={estActif ? 0 : -1}
            onClick={() => onChange(item.cle)}
            onKeyDown={(e) => surClavier(e, index)}
            className={`shrink-0 px-4v py-2v rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
              estActif ? 'bg-primary text-text-on-primary border-primary' : 'border-border text-text-secondary hover:border-primary/50 hover:text-text'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
