import { create } from 'zustand';

export type Role = 'APPRENANT' | 'PARENT' | 'ETABLISSEMENT' | 'DGES' | 'ADMIN';

export interface Utilisateur {
  id: string;
  nip: string | null;
  nom: string;
  prenom: string;
  role: Role;
}

export const CLES_JETONS = { acces: 'accessToken', rafraichissement: 'refreshToken' } as const;
const CLE_UTILISATEUR = 'utilisateur';

interface AuthState {
  user: Utilisateur | null;
  /** Vrai une fois la session restaurée depuis le navigateur : évite de rediriger avant de savoir. */
  pret: boolean;
  initialiser: () => void;
  login: (user: Utilisateur, accessToken: string, refreshToken: string) => void;
  enregistrerJetons: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  pret: false,
  initialiser: () => {
    let user: Utilisateur | null = null;
    try {
      const brut = localStorage.getItem(CLE_UTILISATEUR);
      if (brut && localStorage.getItem(CLES_JETONS.rafraichissement)) user = JSON.parse(brut);
    } catch {
      user = null;
    }
    set({ user, pret: true });
  },
  login: (user, accessToken, refreshToken) => {
    localStorage.setItem(CLES_JETONS.acces, accessToken);
    localStorage.setItem(CLES_JETONS.rafraichissement, refreshToken);
    localStorage.setItem(CLE_UTILISATEUR, JSON.stringify(user));
    set({ user });
  },
  enregistrerJetons: (accessToken, refreshToken) => {
    localStorage.setItem(CLES_JETONS.acces, accessToken);
    localStorage.setItem(CLES_JETONS.rafraichissement, refreshToken);
  },
  logout: () => {
    localStorage.removeItem(CLES_JETONS.acces);
    localStorage.removeItem(CLES_JETONS.rafraichissement);
    localStorage.removeItem(CLE_UTILISATEUR);
    set({ user: null });
  },
}));

/** Page d'arrivée après connexion selon le rôle. */
export function accueilDuRole(role: Role): string {
  if (role === 'APPRENANT' || role === 'PARENT') return '/espace-apprenant';
  if (role === 'DGES' || role === 'ADMIN') return '/stats';
  return '/';
}
