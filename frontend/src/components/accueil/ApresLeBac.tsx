'use client';

import Link from 'next/link';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { Apparition } from '@/components/animation/Apparition';
import { useCatalogueAccueil } from './useCatalogueAccueil';

/** Raccourci « Que faire après mon bac ? » : une pastille par série, vers le catalogue filtré. */
export function ApresLeBac() {
  const { donnees, erreur } = useCatalogueAccueil();

  return (
    <div className="bg-white rounded-bj-lg border border-bj-gray-925 shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-6v">
      <h2 className="flex items-center gap-2v font-bold mb-1v">
        <GraduationCap size={20} className="text-bj-green" aria-hidden="true" /> Que faire après mon bac&nbsp;?
      </h2>
      <p className="text-sm text-bj-gray-500 mb-4v">Choisis ta série : tu verras les formations du supérieur qui l&apos;acceptent.</p>

      {erreur ? (
        <Link href="/catalogue?niveau=APRES_BAC" className="text-sm font-medium text-bj-green hover:underline">
          Voir les formations après le bac →
        </Link>
      ) : (
        <ul className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-5 gap-2v" aria-busy={!donnees}>
          {donnees
            ? donnees.series.map((s, i) => (
                <Apparition as="li" key={s.serie} effet="zoom" delai={300 + i * 35}>
                  <Link
                    href={`/catalogue?serie=${encodeURIComponent(s.serie)}&niveau=APRES_BAC`}
                    aria-label={`Bac ${s.serie} — ${s.libelle}`}
                    title={`Bac ${s.serie} — ${s.libelle}`}
                    className="block py-2v rounded-bj-sm border border-bj-gray-850 text-center font-bold text-bj-gray-200 hover:border-bj-green hover:bg-bj-green/5 hover:text-bj-green transition-colors"
                  >
                    {s.serie}
                  </Link>
                </Apparition>
              ))
            : Array.from({ length: 14 }).map((_, i) => <li key={i} className="h-10 rounded-bj-sm bg-bj-gray-950 animate-pulse" />)}
        </ul>
      )}

      <div className="border-t border-bj-gray-925 mt-6v pt-4v">
        <p className="text-sm font-bold mb-1v">Tu es en 3e&nbsp;?</p>
        <Link href="/catalogue?niveau=APRES_BEPC" className="inline-flex items-center gap-1v text-sm font-medium text-bj-green hover:underline">
          Les formations après le BEPC <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
