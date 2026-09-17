import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { Filiere, PageFilieres, ValeursFiltres } from './filiere';
import type { Decouverte, Favori, Palier, Preference, ProfilApprenant, Recommandation, ReponsesDecouverte } from './apprenant';
import { CLES_JETONS, useAuthStore, type Utilisateur } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(CLES_JETONS.acces);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Un seul rafraîchissement à la fois : le backend révoque le refresh token à chaque utilisation.
let rafraichissementEnCours: Promise<string | null> | null = null;

function rafraichirJeton(): Promise<string | null> {
  if (!rafraichissementEnCours) {
    const refreshToken = localStorage.getItem(CLES_JETONS.rafraichissement);
    rafraichissementEnCours = (
      refreshToken
        ? axios
            .post<Jetons>(`${API_URL}/api/auth/refresh`, { refreshToken })
            .then(({ data }) => {
              useAuthStore.getState().enregistrerJetons(data.accessToken, data.refreshToken);
              return data.accessToken;
            })
            .catch(() => null)
        : Promise.resolve(null)
    ).finally(() => {
      rafraichissementEnCours = null;
    });
  }
  return rafraichissementEnCours;
}

const SANS_RAFRAICHISSEMENT = ['/auth/identification', '/auth/personnel', '/auth/refresh', '/auth/deconnexion'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requete = error.config as (InternalAxiosRequestConfig & { _reessai?: boolean }) | undefined;
    if (
      error.response?.status !== 401 ||
      typeof window === 'undefined' ||
      !requete ||
      requete._reessai ||
      SANS_RAFRAICHISSEMENT.includes(requete.url ?? '')
    ) {
      return Promise.reject(error);
    }

    requete._reessai = true;
    const jeton = await rafraichirJeton();
    if (jeton) {
      requete.headers.Authorization = `Bearer ${jeton}`;
      return api(requete);
    }

    useAuthStore.getState().logout();
    window.location.href = `/identification?redirect=${encodeURIComponent(window.location.pathname)}`;
    return Promise.reject(error);
  }
);

export interface Jetons {
  accessToken: string;
  refreshToken: string;
}

export interface ReponseAuth extends Jetons {
  user: Utilisateur;
}

export interface ApprenantResume {
  nip: string;
  nom: string;
  prenom: string;
  palier: Palier | null;
  serie: string | null;
}

export interface DonneesVoeux {
  filiereId1: string;
  filiereId2?: string;
  filiereId3?: string;
  motivation?: string;
}

export interface Moi extends Utilisateur {
  email: string | null;
  apprenant: ApprenantResume | null;
  enfants: (ApprenantResume & { relation: string })[];
}

export const authApi = {
  /** Élève (NIP ou numéro EducMaster) ou parent (adresse), avec ses identifiants EducMaster. */
  identification: (identifiant: string, motDePasse: string) =>
    api.post<ReponseAuth>('/auth/identification', { identifiant, motDePasse }),
  /** Personnels du ministère : compte interne à la plateforme. */
  personnel: (identifiant: string, motDePasse: string) =>
    api.post<ReponseAuth>('/auth/personnel', { identifiant, motDePasse }),
  moi: () => api.get<Moi>('/auth/moi'),
  logout: () => api.post('/auth/deconnexion'),
};

export interface ParametresCatalogue {
  type?: string;
  niveau?: string;
  search?: string;
  /** Série de bac : formations du supérieur qui l'admettent */
  serie?: string;
  domaine?: string;
  /** Formations ouvertes dans un établissement de ce département */
  departement?: string;
  bourses?: boolean;
  officielle?: boolean;
  page?: number;
  limit?: number;
}

export const filiereApi = {
  list: (params?: ParametresCatalogue) => api.get<PageFilieres>('/filiere', { params }),
  filtres: () => api.get<ValeursFiltres>('/filiere/filtres'),
  get: (id: string) => api.get<Filiere>(`/filiere/${id}`),
  getDebouches: (id: string) => api.get(`/filiere/${id}/debouches`),
};

export const apprenantApi = {
  getFavoris: (nip: string) => api.get<Favori[]>(`/apprenant/${nip}/favoris`),
  ajouterFavori: (nip: string, filiereId: string) => api.put(`/apprenant/${nip}/favoris/${filiereId}`),
  retirerFavori: (nip: string, filiereId: string) => api.delete(`/apprenant/${nip}/favoris/${filiereId}`),
  getProfile: (nip: string) => api.get<ProfilApprenant>(`/apprenant/${nip}`),
  getNotes: (nip: string) => api.get(`/apprenant/${nip}/notes`),
  getPreferences: (nip: string) => api.get<Preference[]>(`/apprenant/${nip}/preferences`),
  enregistrerPreferences: (nip: string, data: DonneesVoeux) =>
    api.post<Preference[]>(`/apprenant/${nip}/preferences`, data),
  validerPreferences: (nip: string) => api.post<Preference>(`/apprenant/${nip}/preferences/validation`),
  getDecouverte: (nip: string) => api.get<Decouverte | null>(`/apprenant/${nip}/decouverte`),
  enregistrerDecouverte: (nip: string, reponses: ReponsesDecouverte) =>
    api.post<Decouverte>(`/apprenant/${nip}/decouverte`, { reponses }),
};

export const orientationApi = {
  getRecommandations: (nip: string) => api.get<Recommandation[]>(`/orientation/${nip}/recommandations`),
  calculer: (nip: string) => api.post<Recommandation[]>(`/orientation/${nip}/calcul`),
};

export interface ReponseConseiller {
  conversationId: string;
  reponse: string;
  outilsUtilises: string[];
}

/** Langue des réponses du conseiller */
export type LangueConseiller = 'fr' | 'fon';

export const conseillerApi = {
  chat: (nip: string, message: string, conversationId?: string, langue: LangueConseiller = 'fr') =>
    api.post<ReponseConseiller>(`/conseiller/${nip}/chat`, { message, langue, ...(conversationId ? { conversationId } : {}) }),
  getHistorique: (nip: string) => api.get(`/conseiller/${nip}/historique`),
};

export const statsApi = {
  getNationales: () => api.get('/stats/national'),
  getDepartement: (code: string) => api.get(`/stats/departement/${code}`),
  getFiliere: () => api.get('/stats/filiere'),
};
