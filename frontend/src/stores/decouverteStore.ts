import { create } from 'zustand';
import { apprenantApi, authApi } from '@/lib/api';
import type { Decouverte } from '@/lib/apprenant';

/**
 * État du mur de découverte : le dossier de référence est celui de l'élève connecté, ou du premier
 * enfant pour un parent (même règle par défaut qu'EspaceContext, pour rester cohérent). Utilisé à la
 * fois par le parcours apprenant et par le filtre par défaut du catalogue.
 */
interface DecouverteMurState {
  statut: 'inactif' | 'chargement' | 'pret';
  nip: string | null;
  decouverte: Decouverte | null;
  /** Utilisateur pour lequel l'état ci-dessus est valide ; évite de garder l'état du précédent compte connecté. */
  pourUtilisateur: string | null;
  charger: (userId: string) => Promise<void>;
  /** Appelé juste après un enregistrement réussi du questionnaire, pour lever le mur sans recharger. */
  definir: (decouverte: Decouverte) => void;
  reinitialiser: () => void;
}

// Une seule requête à la fois par utilisateur, même si plusieurs composants demandent le chargement
let chargementEnCours: string | null = null;

export const useDecouverteStore = create<DecouverteMurState>((set, get) => ({
  statut: 'inactif',
  nip: null,
  decouverte: null,
  pourUtilisateur: null,
  charger: async (userId) => {
    if (chargementEnCours === userId || get().pourUtilisateur === userId) return;
    chargementEnCours = userId;
    set({ statut: 'chargement', pourUtilisateur: userId, nip: null, decouverte: null });
    try {
      const { data: moi } = await authApi.moi();
      const nip = moi.apprenant?.nip ?? moi.enfants[0]?.nip ?? null;
      const decouverte = nip ? (await apprenantApi.getDecouverte(nip)).data : null;
      if (get().pourUtilisateur === userId) set({ statut: 'pret', nip, decouverte });
    } catch {
      if (get().pourUtilisateur === userId) set({ statut: 'pret', nip: null, decouverte: null });
    } finally {
      chargementEnCours = null;
    }
  },
  definir: (decouverte) => set({ decouverte }),
  reinitialiser: () => {
    chargementEnCours = null;
    set({ statut: 'inactif', nip: null, decouverte: null, pourUtilisateur: null });
  },
}));
