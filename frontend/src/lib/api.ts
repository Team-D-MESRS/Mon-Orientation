import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { EtablissementPourVoeu, Filiere, PageFilieres, ValeursFiltres } from './filiere';
import type { Critere, Decouverte, EntreeHistorique, Favori, Palier, Preference, ProfilApprenant, Recommandation, ReponsesDecouverte } from './apprenant';
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
  /** Terminale seulement */
  filiereId3?: string;
  /** 3e seulement */
  etablissementId?: string;
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
  /** Établissements qui dispensent toutes les filières données (choix d'établissement de la fiche unique). */
  etablissementsCommuns: (filiereIds: string[]) =>
    api.get<EtablissementPourVoeu[]>('/filiere/etablissements', {
      params: { filiere1: filiereIds[0], filiere2: filiereIds[1] },
    }),
};

export const apprenantApi = {
  getFavoris: (nip: string) => api.get<Favori[]>(`/apprenant/${nip}/favoris`),
  ajouterFavori: (nip: string, filiereId: string) => api.put(`/apprenant/${nip}/favoris/${filiereId}`),
  retirerFavori: (nip: string, filiereId: string) => api.delete(`/apprenant/${nip}/favoris/${filiereId}`),
  getProfile: (nip: string) => api.get<ProfilApprenant>(`/apprenant/${nip}`),
  getHistoriqueNotes: (nip: string) => api.get<EntreeHistorique[]>(`/apprenant/${nip}/notes/historique`),
  getPreferences: (nip: string) => api.get<Preference[]>(`/apprenant/${nip}/preferences`),
  enregistrerPreferences: (nip: string, data: DonneesVoeux) =>
    api.post<Preference[]>(`/apprenant/${nip}/preferences`, data),
  getDecouverte: (nip: string) => api.get<Decouverte | null>(`/apprenant/${nip}/decouverte`),
  enregistrerDecouverte: (nip: string, reponses: ReponsesDecouverte) =>
    api.post<Decouverte>(`/apprenant/${nip}/decouverte`, { reponses }),
};

export const orientationApi = {
  getRecommandations: (nip: string) => api.get<Recommandation[]>(`/orientation/${nip}/recommandations`),
  calculer: (nip: string) => api.post<Recommandation[]>(`/orientation/${nip}/calcul`),
  /** Évalue une formation précise (par son code), même hors des pistes déjà calculées pour l'élève. */
  evaluerFiliere: (nip: string, code: string) => api.get<EvaluationFiliere>(`/orientation/${nip}/evaluer/${encodeURIComponent(code)}`),
};

export interface EvaluationFiliere {
  filiere: Filiere;
  niveauEleve: string;
  accessibleAuNiveauActuel: boolean;
  score: number | null;
  admissible: boolean;
  rangVoeu: number | null;
  criteres: Critere[];
}

export interface ReponseConseiller {
  conversationId: string;
  reponse: string;
  outilsUtilises: string[];
}

export const conseillerApi = {
  chat: (nip: string, message: string, conversationId?: string) =>
    api.post<ReponseConseiller>(`/conseiller/${nip}/chat`, {
      message,
      ...(conversationId ? { conversationId } : {}),
    }),
  getHistorique: (nip: string) => api.get(`/conseiller/${nip}/historique`),
};

export interface StatsNationales {
  totalApprenants: number;
  totalFiliere: number;
  totalEtablissements: number;
  repartitionType: { type: string; _count: number }[];
}

export interface StatsDepartement {
  departement: string;
  apprenants: number;
  etablissements: number;
}

export const statsApi = {
  getNationales: () => api.get<StatsNationales>('/stats/national'),
  getDepartements: () => api.get<StatsDepartement[]>('/stats/departements'),
  getDepartement: (code: string) => api.get(`/stats/departement/${code}`),
  getFiliere: () => api.get('/stats/filiere'),
  getObservatoire: (params?: { debut?: string; fin?: string; departement?: string }) => api.get<StatsObservatoire>('/stats/observatoire', { params }),
  exporter: (format: 'csv' | 'xlsx', params?: { debut?: string; fin?: string; departement?: string }) =>
    api.get<Blob>('/stats/export', { params: { ...params, format }, responseType: 'blob' }),
};

export interface StatsObservatoire {
  periode: { debut: string; fin: string };
  filtres: { departement: string | null };
  synthese: { apprenants: number; nouveauxApprenants: number; parentsActifs: number; etablissementsActifs: number; filieresPubliees: number; offresFormationActives: number };
  parcours: { apprenantsAvecDecouverte: number; decouvertesEnregistrees: number; recommandationsCalculees: number; preferencesEnregistrees: number; preferencesValideesParParent: number; favorisEnregistres: number; tauxDecouverte: number; tauxValidationParent: number };
  territoires: StatsDepartement[];
  repartition: { parPalier: { valeur: string | null; total: number }[]; parSerie: { valeur: string | null; total: number }[] };
  qualiteCatalogue: { total: number; sansSource: number; sansDescription: number; sansImage: number; sansDomaine: number; etablissementAvecDepartementEtCommune: number; tauxLocalisationEtablissement: number };
  filieresLesPlusRecommandees: { id: string; nom: string; type: string | null; recommandations: number }[];
  usages: { sansIdentifiantVisiteur: true; sansTexteLibre: true; evenementsParJour: { jour: string; type: string; total: number }[]; evenementsParTypeEtDimension: { type: string; dimension: string | null; total: number }[] };
}

export type TypeRessourceAdmin = 'FILIERE' | 'ETABLISSEMENT' | 'PAGE_SITE';
export type FiliereAdmin = Omit<Filiere, 'offres'> & {
  masquee: boolean;
  imageUrl: string | null;
  etablissementId: string | null;
  offres: { etablissementId: string; duree: string | null; source: string }[];
};
export interface PageSiteAdmin {
  id: string;
  slug: string;
  titre: string;
  intro: string | null;
  sections: { titre: string; paragraphes: string[]; lienLabel?: string | null; lienUrl?: string | null }[];
  statut: 'BROUILLON' | 'PUBLIE' | 'ARCHIVE';
  updatedAt: string;
}
export interface EtablissementAdmin {
  id: string;
  code: string | null;
  educmasterId: string | null;
  nom: string;
  sigle: string | null;
  universite: string | null;
  type: string;
  departement: string | null;
  commune: string | null;
  quartier: string | null;
  internat: boolean | null;
  externat: boolean | null;
  capacite: number | null;
  actif: boolean;
  offres: { filiereId: string; duree: string | null; source: string }[];
}
export interface BrouillonAdmin {
  id: string;
  type: TypeRessourceAdmin;
  cibleId: string | null;
  titre: string;
  payload: Record<string, unknown>;
  etat: 'BROUILLON' | 'PUBLIE';
  createdAt: string;
  updatedAt: string;
  auteur?: { nom: string; prenom: string };
}
export interface HistoriqueAdmin {
  id: string;
  type: TypeRessourceAdmin;
  cibleId: string;
  action: string;
  avant: Record<string, unknown> | null;
  apres: Record<string, unknown> | null;
  createdAt: string;
  auteur: { nom: string; prenom: string };
}
export const adminApi = {
  resume: () => api.get<{ filieres: number; etablissements: number; pagesPubliees: number; brouillons: number }>('/admin/resume'),
  catalogue: () => api.get<FiliereAdmin[]>('/admin/catalogue'),
  etablissements: () => api.get<EtablissementAdmin[]>('/admin/etablissements'),
  pages: () => api.get<PageSiteAdmin[]>('/admin/pages'),
  brouillons: () => api.get<BrouillonAdmin[]>('/admin/brouillons'),
  historique: (params?: { type?: TypeRessourceAdmin; cibleId?: string }) => api.get<HistoriqueAdmin[]>('/admin/historique', { params }),
  creerBrouillon: (type: TypeRessourceAdmin, payload: Record<string, unknown>, cibleId?: string) =>
    api.post<BrouillonAdmin>('/admin/brouillons', { type, ...(cibleId ? { cibleId } : {}), payload }),
  modifierBrouillon: (id: string, payload: Record<string, unknown>) => api.patch<BrouillonAdmin>(`/admin/brouillons/${id}`, { payload }),
  supprimerBrouillon: (id: string) => api.delete(`/admin/brouillons/${id}`),
  publier: (id: string) => api.post<BrouillonAdmin>(`/admin/brouillons/${id}/publier`),
  restaurer: (id: string) => api.post<BrouillonAdmin>(`/admin/historique/${id}/restaurer`),
};

export const mediaApi = {
  televerserImage: (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return api.post<{ url: string; key: string; type: string; taille: number }>('/admin/media', body);
  },
};

export interface PageSitePublique {
  slug: string;
  titre: string;
  intro: string | null;
  sections: PageSiteAdmin['sections'];
  updatedAt: string;
}
export const contenuSiteApi = {
  get: (slug: string) => api.get<PageSitePublique>(`/contenu-site/${encodeURIComponent(slug)}`),
};

export type TypeEvenementUsage = 'RECHERCHE_CATALOGUE' | 'CONSULTATION_FILIERE' | 'UTILISATION_GUIDO';
export const analyticsApi = {
  enregistrer: (type: TypeEvenementUsage, dimension?: string) => axios.post(`${API_URL}/api/analytics/evenements`, { type, ...(dimension ? { dimension } : {}) }, { headers: { 'Content-Type': 'application/json' }, withCredentials: false }),
};
