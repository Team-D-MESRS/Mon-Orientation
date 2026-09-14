import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MAX_COMPARAISON } from '@/lib/filiere';

export interface FiliereComparee {
  id: string;
  nom: string;
}

interface ComparateurState {
  selection: FiliereComparee[];
  /** Message affiché quand la sélection est pleine */
  alerte: string | null;
  basculer: (filiere: FiliereComparee) => void;
  retirer: (id: string) => void;
  remplacer: (selection: FiliereComparee[]) => void;
  vider: () => void;
}

/**
 * Formations choisies pour la comparaison, conservées dans le navigateur le temps de parcourir le catalogue.
 * Restaurées après le premier affichage (skipHydration) pour que le rendu serveur et le rendu client coïncident.
 */
export const useComparateur = create<ComparateurState>()(
  persist(
    (set, get) => ({
      selection: [],
      alerte: null,
      basculer: (filiere) => {
        const { selection } = get();
        if (selection.some((f) => f.id === filiere.id)) {
          set({ selection: selection.filter((f) => f.id !== filiere.id), alerte: null });
        } else if (selection.length >= MAX_COMPARAISON) {
          set({ alerte: `${MAX_COMPARAISON} formations au maximum : retire-en une pour en ajouter une autre.` });
        } else {
          set({ selection: [...selection, { id: filiere.id, nom: filiere.nom }], alerte: null });
        }
      },
      retirer: (id) => set({ selection: get().selection.filter((f) => f.id !== id), alerte: null }),
      remplacer: (selection) => set({ selection: selection.slice(0, MAX_COMPARAISON), alerte: null }),
      vider: () => set({ selection: [], alerte: null }),
    }),
    {
      name: 'comparateur',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ selection }) => ({ selection }),
      skipHydration: true,
    },
  ),
);

/** Restaure la sélection enregistrée (une seule fois) avant de la lire ou de la modifier. */
export const restaurerComparateur = () =>
  useComparateur.persist.hasHydrated() ? Promise.resolve() : Promise.resolve(useComparateur.persist.rehydrate());
