import { analyticsApi, type TypeEvenementUsage } from '@/lib/api';

const CLE_CONSENTEMENT = 'mon-orientation-mesure-audience-v1';

/** Envoie uniquement un type d’action et une dimension métier contrôlée, jamais un texte ou un identifiant. */
export function mesurerUsage(type: TypeEvenementUsage, dimension?: string) {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage.getItem(CLE_CONSENTEMENT) !== 'oui') return;
    void analyticsApi.enregistrer(type, dimension).catch(() => undefined);
  } catch {
    // En cas de stockage indisponible, l’audience n’est pas mesurée.
  }
}
