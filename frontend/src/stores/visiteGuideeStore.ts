import { create } from 'zustand';

/**
 * Signal minimal pour relancer la visite guidée depuis le header (« Revoir la visite guidée »),
 * même quand elle a déjà été vue (flag localStorage posé). CadreEspace/VisiteGuidee vit dans un
 * autre sous-arbre que Header : ce store est le seul point de contact entre les deux.
 */
interface VisiteGuideeState {
  relance: boolean;
  demanderRelance: () => void;
  consommerRelance: () => void;
}

export const useVisiteGuideeStore = create<VisiteGuideeState>((set) => ({
  relance: false,
  demanderRelance: () => set({ relance: true }),
  consommerRelance: () => set({ relance: false }),
}));
