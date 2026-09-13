/** Chemin passé en ?redirect=, limité aux chemins internes pour éviter les redirections ouvertes. */
export function cheminDeRetour(): string | null {
  if (typeof window === 'undefined') return null;
  const cible = new URLSearchParams(window.location.search).get('redirect');
  if (!cible || !cible.startsWith('/') || cible.startsWith('//') || cible.startsWith('/\\')) return null;
  return cible;
}
