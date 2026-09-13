import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { Filiere, PageFilieres } from './filiere';
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

const SANS_RAFRAICHISSEMENT = ['/auth/connexion', '/auth/inscription', '/auth/refresh', '/auth/deconnexion'];

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
    window.location.href = `/connexion?redirect=${encodeURIComponent(window.location.pathname)}`;
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

export interface DonneesInscription {
  role: 'APPRENANT' | 'PARENT';
  nom: string;
  prenom: string;
  motDePasse: string;
  nip?: string;
  dateNaissance?: string;
  email?: string;
}

export interface ApprenantResume {
  nip: string;
  nom: string;
  prenom: string;
}

export interface Moi extends Utilisateur {
  email: string | null;
  apprenant: ApprenantResume | null;
  enfants: (ApprenantResume & { relation: string })[];
}

export const authApi = {
  login: (identifiant: string, motDePasse: string) =>
    api.post<ReponseAuth>('/auth/connexion', { identifiant, motDePasse }),
  register: (data: DonneesInscription) => api.post<ReponseAuth>('/auth/inscription', data),
  moi: () => api.get<Moi>('/auth/moi'),
  logout: () => api.post('/auth/deconnexion'),
};

export const filiereApi = {
  list: (params?: { type?: string; niveau?: string; search?: string; page?: number; limit?: number }) =>
    api.get<PageFilieres>('/filiere', { params }),
  get: (id: string) => api.get<Filiere>(`/filiere/${id}`),
  getDebouches: (id: string) => api.get(`/filiere/${id}/debouches`),
};

export const apprenantApi = {
  getProfile: (nip: string) => api.get(`/apprenant/${nip}`),
  getNotes: (nip: string) => api.get(`/apprenant/${nip}/notes`),
  getPreferences: (nip: string) => api.get(`/apprenant/${nip}/preferences`),
};

export const orientationApi = {
  getRecommandations: (nip: string) => api.get(`/orientation/${nip}/recommandations`),
  calculer: (nip: string) => api.post(`/orientation/${nip}/calcul`),
};

export const conseillerApi = {
  chat: (nip: string, message: string, langue?: string) =>
    api.post(`/conseiller/${nip}/chat`, { message, langue }),
  getHistorique: (nip: string) => api.get(`/conseiller/${nip}/historique`),
};

export const statsApi = {
  getNationales: () => api.get('/stats/national'),
  getDepartement: (code: string) => api.get(`/stats/departement/${code}`),
  getFiliere: () => api.get('/stats/filiere'),
};
