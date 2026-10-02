import type { Filiere } from './filiere';

const PAR_DOMAINE: Record<string, string> = {
  ARTISANAT: '/images/card-artisanat.webp',
  ARTS: '/images/card-arts.webp',
  NUMERIQUE: '/images/card-numerique.webp',
  AGRICULTURE: '/images/card-agriculture.webp',
  INDUSTRIE: '/images/card-industrie.webp',
  SANTE: '/images/card-services.webp',
  BTP: '/images/card-btp.webp',
  DROIT: '/images/card-droit.webp',
  ELECTRICITE: '/images/card-electricite.webp',
  ENVIRONNEMENT: '/images/card-environnement.webp',
  GESTION: '/images/card-gestion.webp',
  ENSEIGNEMENT: '/images/card-enseignement.webp',
  SPORT: '/images/card-sport.webp',
  TOURISME: '/images/card-tourisme.webp',
};

const PAR_TYPE: Record<string, string> = {
  TECHNIQUE_AGRICOLE: '/images/card-agriculture.webp',
  TECHNIQUE: '/images/card-industrie.webp',
  UNIVERSITE: '/images/card-numerique.webp',
  GENERALE: '/images/card-services.webp',
  PROFESSIONNELLE: '/images/card-services.webp',
};

export function visuelFiliere(filiere: Pick<Filiere, 'domaines' | 'type'>): string {
  return PAR_DOMAINE[filiere.domaines[0]] ?? PAR_TYPE[filiere.type] ?? '/images/card-services.webp';
}
