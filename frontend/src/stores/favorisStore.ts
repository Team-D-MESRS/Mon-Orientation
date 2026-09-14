import { useEffect } from 'react';
import { create } from 'zustand';
import { apprenantApi } from '@/lib/api';
import type { Favori } from '@/lib/apprenant';
import type { Filiere } from '@/lib/filiere';
import { messageErreur } from '@/lib/erreurs';
import { useAuthStore } from './authStore';

interface FavorisState {
  /** Dossier dont les favoris sont chargés */
  nip: string | null;
  favoris: Favori[] | null;
  erreur: string | null;
  charger: (nip: string) => Promise<void>;
  basculer: (nip: string, filiere: Filiere) => Promise<void>;
}

// Toutes les cartes du catalogue demandent le chargement en même temps : une seule requête par dossier
let chargementEnCours: string | null = null;

export const useFavorisStore = create<FavorisState>((set, get) => ({
  nip: null,
  favoris: null,
  erreur: null,
  charger: async (nip) => {
    if (chargementEnCours === nip || (get().nip === nip && get().favoris)) return;
    chargementEnCours = nip;
    set({ nip, favoris: null, erreur: null });
    try {
      const { data } = await apprenantApi.getFavoris(nip);
      if (get().nip === nip) set({ favoris: data });
    } catch (err) {
      if (get().nip === nip) set({ erreur: messageErreur(err) });
    } finally {
      chargementEnCours = null;
    }
  },
  // Mise à jour immédiate de l'affichage, annulée si le serveur refuse
  basculer: async (nip, filiere) => {
    const avant = get().favoris ?? [];
    const present = avant.some((f) => f.filiereId === filiere.id);
    set({
      favoris: present
        ? avant.filter((f) => f.filiereId !== filiere.id)
        : [{ filiereId: filiere.id, ajouteLe: new Date().toISOString(), filiere }, ...avant],
      erreur: null,
    });
    try {
      if (present) await apprenantApi.retirerFavori(nip, filiere.id);
      else await apprenantApi.ajouterFavori(nip, filiere.id);
    } catch (err) {
      set({ favoris: avant, erreur: messageErreur(err) });
    }
  },
}));

/** Formations mises de côté par l'élève connecté ; inactif pour les visiteurs et les autres rôles. */
export function useFavoris() {
  const user = useAuthStore((s) => s.user);
  const nip = user?.role === 'APPRENANT' ? user.nip : null;
  const { nip: nipCharge, favoris, erreur, charger, basculer } = useFavorisStore();

  useEffect(() => {
    if (nip) charger(nip);
  }, [nip, charger]);

  const actuels = nip && nipCharge === nip ? favoris : null;
  return {
    actif: !!nip,
    /** Faux tant que la liste n'est pas chargée : un clic serait perdu */
    pret: !!actuels,
    favoris: actuels ?? [],
    erreur: nip && nipCharge === nip ? erreur : null,
    estFavori: (filiereId: string) => !!actuels?.some((f) => f.filiereId === filiereId),
    basculer: (filiere: Filiere) => (nip && actuels ? basculer(nip, filiere) : Promise.resolve()),
  };
}
