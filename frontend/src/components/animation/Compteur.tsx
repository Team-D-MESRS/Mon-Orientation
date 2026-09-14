'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Nombre qui défile de 0 à sa valeur quand il devient visible. Valeur affichée directement sans JavaScript
 * ou quand les animations sont désactivées. À placer dans un texte masqué aux lecteurs d'écran (aria-hidden),
 * doublé d'une version fixe : sinon chaque étape du défilement serait lue.
 */
export function Compteur({ valeur, duree = 1200 }: { valeur: number; duree?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [affiche, setAffiche] = useState(valeur);

  useEffect(() => {
    const element = ref.current;
    if (!element || !document.documentElement.hasAttribute('data-animations') || !('IntersectionObserver' in window)) {
      setAffiche(valeur);
      return;
    }
    setAffiche(0);
    let image = 0;
    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (!entree.isIntersecting) return;
        observateur.disconnect();
        const debut = performance.now();
        const avancer = (maintenant: number) => {
          const progression = Math.min((maintenant - debut) / duree, 1);
          // Décélération en fin de course
          setAffiche(Math.round(valeur * (1 - Math.pow(1 - progression, 3))));
          if (progression < 1) image = requestAnimationFrame(avancer);
        };
        image = requestAnimationFrame(avancer);
      },
      { threshold: 0.5 },
    );
    observateur.observe(element);
    return () => {
      observateur.disconnect();
      cancelAnimationFrame(image);
    };
  }, [valeur, duree]);

  return (
    <span ref={ref} className="tabular-nums">
      {affiche}
    </span>
  );
}
