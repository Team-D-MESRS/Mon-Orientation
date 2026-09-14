'use client';

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';

export type Effet = 'monter' | 'gauche' | 'droite' | 'zoom';

type Props = {
  /** Élément rendu (div par défaut ; li dans une liste, h1, etc.) */
  as?: ElementType;
  effet?: Effet;
  /** Délai en millisecondes, pour faire apparaître une série d'éléments l'un après l'autre */
  delai?: number;
  className?: string;
  children: ReactNode;
} & Record<string, unknown>;

/**
 * Fait apparaître son contenu quand il entre à l'écran (styles dans globals.css).
 * Le contenu n'est masqué que si layout.tsx a activé les animations : sans JavaScript, à l'impression
 * ou quand le système demande de réduire les animations, tout reste visible.
 */
export function Apparition({ as: Balise = 'div', effet = 'monter', delai = 0, className, children, ...reste }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [apparu, setApparu] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!('IntersectionObserver' in window)) {
      setApparu(true);
      return;
    }
    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (entree.isIntersecting) {
          setApparu(true);
          observateur.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
    );
    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);

  return (
    <Balise
      ref={ref}
      data-apparition={effet}
      data-apparu={apparu || undefined}
      className={className}
      style={delai ? ({ '--delai': `${delai}ms` } as CSSProperties) : undefined}
      {...reste}
    >
      {children}
    </Balise>
  );
}
