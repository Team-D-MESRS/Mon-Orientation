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
  ArrowUpRight,
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

const VISUELS: Partial<Record<Domaine, { image: string; ton: string; accroche: string }>> = {
  NUMERIQUE: { image: '/images/card-numerique.webp', ton: 'mint', accroche: 'Créer · résoudre · connecter' },
  AGRICULTURE: { image: '/images/card-agriculture.webp', ton: 'sun', accroche: 'Cultiver · protéger · nourrir' },
  INDUSTRIE: { image: '/images/card-industrie.webp', ton: 'corail', accroche: 'Bâtir · fabriquer · améliorer' },
  SANTE: { image: '/images/card-services.webp', ton: 'bleu', accroche: 'Écouter · accompagner · agir' },
};

const ORDRE_FEATURES: Domaine[] = ['NUMERIQUE', 'AGRICULTURE', 'INDUSTRIE', 'SANTE'];

/** Domaines issus de l’API : quatre cartes éditoriales illustrées puis le reste en liste compacte. */
export function Domaines() {
  const { donnees, erreur } = useCatalogueAccueil();

  if (erreur) {
    return (
      <p className="mo-catalogue-error">
        Les domaines ne peuvent pas être affichés pour le moment.{' '}
        <Link href="/catalogue">Ouvrir le catalogue <ArrowRightInline /></Link>
      </p>
    );
  }

  if (!donnees) {
    return <div className="mo-domain-loading" aria-busy="true">{Array.from({ length: 4 }).map((_, i) => <div key={i} />)}</div>;
  }

  const featured = ORDRE_FEATURES.map((code) => donnees.domaines.find((d) => d.code === code)).filter(Boolean);
  const featuredCodes = new Set(featured.map((d) => d!.code));
  const compact = donnees.domaines.filter((d) => !featuredCodes.has(d.code));

  return (
    <>
      <p className="mo-catalogue-summary">
        <span aria-hidden="true"><Compteur valeur={donnees.total} /> formations recensées dans {donnees.domaines.length} domaines.</span>
        <span className="sr-only">{`${donnees.total} formations recensées dans ${donnees.domaines.length} domaines.`}</span>
      </p>
      <div className="mo-domain-featured">
        {featured.map((d, i) => {
          if (!d) return null;
          const Icone = ICONES[d.code];
          const visuel = VISUELS[d.code];
          if (!visuel) return null;
          return (
            <Apparition as="article" key={d.code} delai={i * 100}>
              <Link href={`/catalogue?domaine=${d.code}`} className={`mo-domain-card mo-domain-${visuel.ton}`}>
                <div className="mo-domain-image"><img src={visuel.image} alt="" /><span className="mo-domain-icon"><Icone size={18} aria-hidden="true" /></span><span className="mo-domain-arrow"><ArrowUpRight size={18} aria-hidden="true" /></span></div>
                <div className="mo-domain-body"><span className="mo-domain-eyebrow">{visuel.accroche}</span><h3>{d.libelle}</h3><p>Explore les formations, les métiers et les chemins possibles dans ce domaine.</p><div className="mo-domain-meta"><span>{d.total} formation{d.total > 1 ? 's' : ''}</span><span>Voir le domaine</span></div></div>
              </Link>
            </Apparition>
          );
        })}
      </div>
      <ul className="mo-domain-compact" aria-label="Autres domaines du catalogue">
        {compact.map((d, i) => {
          const Icone = ICONES[d.code];
          return (
            <Apparition as="li" key={d.code} delai={(i % 4) * 70}>
              <Link href={`/catalogue?domaine=${d.code}`}>
                <span className="mo-compact-icon"><Icone size={17} aria-hidden="true" /></span>
                <span><strong>{d.libelle}</strong><small>{d.total} formation{d.total > 1 ? 's' : ''}</small></span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </Apparition>
          );
        })}
      </ul>
    </>
  );
}

function ArrowRightInline() {
  return <span aria-hidden="true">→</span>;
}
