import type { Filiere } from './filiere';
import { normaliser } from './filiere';

const PAR_DOMAINE: Record<string, string> = {
  ARTISANAT: '/images/card-artisanat.webp',
  ARTS: '/images/card-arts.webp',
  NUMERIQUE: '/images/card-numerique.webp',
  AGRICULTURE: '/images/card-agriculture.webp',
  INDUSTRIE: '/images/card-industrie.webp',
  LETTRES: '/images/card-lettres.webp',
  SANTE: '/images/card-services.webp',
  SCIENCES: '/images/card-sciences.webp',
  BTP: '/images/card-btp.webp',
  DROIT: '/images/card-droit.webp',
  ELECTRICITE: '/images/card-electricite.webp',
  ENVIRONNEMENT: '/images/card-environnement.webp',
  GESTION: '/images/card-gestion.webp',
  ENSEIGNEMENT: '/images/card-enseignement.webp',
  SPORT: '/images/card-sport.webp',
  TOURISME: '/images/card-tourisme.webp',
};

const PAR_CODE: Record<string, string> = {
  'DTM-LTP-ENR': '/images/card-energie-solaire.webp',
  'DTM-LTP-RESEAUX-CYBER': '/images/card-reseaux-cyber.webp',
  'DTM-LTP-MECA-AUTO': '/images/card-automobile.webp',
  'DTM-LTP-GROS-OEUVRE': '/images/card-gros-oeuvre.webp',
  'DTM-LTP-TOPOGRAPHIE': '/images/card-topographie.webp',
  'DTM-LTP-ACCUEIL-TOURISTIQUE': '/images/card-accueil-touristique.webp',
};

const PAR_TYPE: Record<string, string> = {
  TECHNIQUE_AGRICOLE: '/images/card-agriculture.webp',
  TECHNIQUE: '/images/card-industrie.webp',
  UNIVERSITE: '/images/card-numerique.webp',
  GENERALE: '/images/card-services.webp',
  PROFESSIONNELLE: '/images/card-services.webp',
};

export function visuelFiliere(filiere: Pick<Filiere, 'domaines' | 'type' | 'code' | 'nom'>): string {
  const specific = filiere.code ? PAR_CODE[filiere.code] : undefined;
  if (specific) return specific;

  const nom = normaliser(filiere.nom);
  if (/\b(?:automobile|automobiles|auto|equipements? motorises?)\b/.test(nom)) {
    return '/images/card-automobile.webp';
  }

  return PAR_DOMAINE[filiere.domaines[0]] ?? PAR_TYPE[filiere.type] ?? '/images/card-services.webp';
}
