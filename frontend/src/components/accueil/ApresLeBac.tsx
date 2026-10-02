'use client';

import Link from 'next/link';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { Apparition } from '@/components/animation/Apparition';
import { useCatalogueAccueil } from './useCatalogueAccueil';

/** Raccourci « Que faire après mon bac ? » : une pastille par série, vers le catalogue filtré. */
export function ApresLeBac() {
  const { donnees, erreur } = useCatalogueAccueil();

  return (
    <div className="mo-bac-panel">
      <h2><GraduationCap size={18} aria-hidden="true" /> Après le BEPC ou après le bac&nbsp;?</h2>
      <p className="mo-bac-question">Tu es en 4e ou en 3e&nbsp;?</p>
      <Link href="/catalogue?niveau=APRES_BEPC" className="mo-bac-link">Voir les formations après le BEPC <ArrowRight size={14} aria-hidden="true" /></Link>
      <div className="mo-bac-divider" />
      <p className="mo-bac-question">Tu es en 1re, en Terminale ou déjà bachelier&nbsp;?</p>
      <p className="mo-bac-help">Choisis ta série : tu verras les formations du supérieur qui l&apos;acceptent.</p>
      {erreur ? (
        <Link href="/catalogue?niveau=APRES_BAC" className="mo-bac-link">Voir les formations après le bac <ArrowRight size={14} aria-hidden="true" /></Link>
      ) : (
        <ul className="mo-series-grid" aria-busy={!donnees}>
          {donnees
            ? donnees.series.map((s, i) => (
                <Apparition as="li" key={s.serie} effet="zoom" delai={300 + i * 35}>
                  <Link href={`/catalogue?serie=${encodeURIComponent(s.serie)}&niveau=APRES_BAC`} aria-label={`Bac ${s.serie} — ${s.libelle}`} title={`Bac ${s.serie} — ${s.libelle}`}>
                    {s.serie}
                  </Link>
                </Apparition>
              ))
            : Array.from({ length: 10 }).map((_, i) => <li key={i} className="mo-series-skeleton" />)}
        </ul>
      )}
    </div>
  );
}
