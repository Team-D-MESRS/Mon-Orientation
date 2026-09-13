'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

/** Restaure la session enregistrée dans le navigateur au premier affichage. */
export function AuthInitialiser() {
  useEffect(() => {
    useAuthStore.getState().initialiser();
  }, []);
  return null;
}
