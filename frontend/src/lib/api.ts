import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/connexion';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (identifiant: string, motDePasse: string) =>
    api.post('/auth/connexion', { identifiant, motDePasse }),
  register: (data: any) => api.post('/auth/inscription', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

export const filiereApi = {
  list: (params?: { type?: string; search?: string; page?: number }) =>
    api.get('/filiere', { params }),
  get: (id: string) => api.get(`/filiere/${id}`),
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
