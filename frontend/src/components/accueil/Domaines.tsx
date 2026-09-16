'use client';

import Link from 'next/link';
import {
  BarChart3,
  BookOpen,
  Droplets,
  Dumbbell,
  FlaskConical,
  HardHat,
  Monitor,
  Palette,
  Scale,
  School,
  Scissors,
  Sprout,
  Stethoscope,
  UtensilsCrossed,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { Domaine } from '@/lib/filiere';
import { Apparition } from '@/components/animation/Apparition';
import { Compteur } from '@/components/animation/Compteur';
import { useCatalogueAccueil } from './useCatalogueAccueil';

const ICONES: Record<Domaine, LucideIcon> = {
  AGRICULTURE: Sprout,
  ARTISANAT: Scissors,
  ARTS: Palette,
  BTP: HardHat,
  DROIT: Scale,
  ELECTRICITE: Zap,
  ENSEIGNEMENT: School,
  ENVIRONNEMENT: Droplets,
  GESTION: BarChart3,
  INDUSTRIE: Wrench,
  LETTRES: BookOpen,
  NUMERIQUE: Monitor,
  SANTE: Stethoscope,
  SCIENCES: FlaskConical,
  SPORT: Dumbbell,
  TOURISME: UtensilsCrossed,
};

/** Un domaine par tuile, avec son nombre réel de formations, vers le catalogue filtré. */
export function Domaines() {
  const { donnees, erreur } = useCatalogueAccueil();

  if (erreur) {
    return (
      <p className="text-bj-gray-500">
        Les domaines ne peuvent pas être affichés pour le moment.{' '}
        <Link href="/catalogue" className="font-medium text-bj-green hover:underline">
          Ouvrir le catalogue
        </Link>
      </p>
    );
  }

  return (
    <>
      <p className="text-bj-gray-500 mb-8v">
        {donnees ? (
          <>
            {/* Compteur animé caché aux lecteurs d'écran, qui lisent la phrase fixe */}
            <span aria-hidden="true">
              <Compteur valeur={donnees.total} /> formations recensées dans {donnees.domaines.length} domaines, chacune avec ses sources.
            </span>
            <span className="sr-only">{`${donnees.total} formations recensées dans ${donnees.domaines.length} domaines, chacune avec ses sources.`}</span>
          </>
        ) : (
          'Chargement du catalogue…'
        )}
      </p>
      {/* Deux colonnes dès le téléphone (icône au-dessus du texte), pour ne pas empiler 14 tuiles */}
      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3v" aria-busy={!donnees}>
        {donnees
          ? donnees.domaines.map((d, i) => {
              const Icone = ICONES[d.code];
              return (
                // Décalage par colonne : chaque rangée arrive de gauche à droite
                <Apparition as="li" key={d.code} delai={(i % 4) * 90}>
                  <Link
                    href={`/catalogue?domaine=${d.code}`}
                    className="bj-card flex flex-col sm:flex-row items-start sm:items-center gap-2v sm:gap-3v p-3v sm:p-4v h-full"
                  >
                    <span className="w-10 h-10 rounded-full bg-bj-green/10 text-bj-green flex items-center justify-center shrink-0">
                      <Icone size={20} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold leading-tight">{d.libelle}</span>
                      <span className="block text-xs text-bj-gray-500 mt-1v">
                        {d.total} formation{d.total > 1 ? 's' : ''}
                      </span>
                    </span>
                  </Link>
                </Apparition>
              );
            })
          : Array.from({ length: 8 }).map((_, i) => <li key={i} className="h-[4.5rem] rounded-bj-md bg-bj-gray-950 animate-pulse" />)}
      </ul>
    </>
  );
}
