import axios from 'axios';

/** Message lisible pour l'utilisateur à partir d'une erreur d'appel API. */
export function messageErreur(err: unknown, parStatut: Partial<Record<number, string>> = {}): string {
  if (!axios.isAxiosError(err)) return 'Une erreur inattendue est survenue.';
  if (!err.response) return 'Serveur injoignable. Vérifie ta connexion internet et réessaie.';

  const { status, data } = err.response;
  const personnalise = parStatut[status];
  if (personnalise) return personnalise;
  if (status === 429) return 'Trop de tentatives. Patiente une minute avant de réessayer.';

  const message = (data as { message?: string | string[] } | undefined)?.message;
  if (status < 500 && message) return Array.isArray(message) ? message.join(' ') : message;
  return 'Une erreur est survenue. Réessaie dans quelques instants.';
}
