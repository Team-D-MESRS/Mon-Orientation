'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useDecouverteStore } from '@/stores/decouverteStore';
import { Chargement } from '@/components/espace/ui';

const CIBLE = '/espace-apprenant/decouverte';

/**
 * Pages joignables par un élève/parent connecté sans questionnaire de découverte rempli : accueil,
 * identification, pages publiques d'information, et le questionnaire lui-même (sinon boucle
 * infinie). Tout le reste — dont /catalogue et le reste de /espace-apprenant — est bloqué (décisions
 * du 18/09 : le test devient le point d'entrée central, avant toute autre page).
 */
const ROUTES_EXEMPTES = new Set([
  '/',
  '/identification',
  '/personnels',
  '/guide',
  '/faq',
  '/contact',
  '/mentions-legales',
  '/donnees-personnelles',
  '/accessibilite',
  CIBLE,
]);

/**
 * Garde-fou de routage global : redirige tout élève/parent connecté sans questionnaire de
 * découverte rempli vers ce questionnaire, avant toute autre page non exemptée. Un parent dont
 * l'enfant n'a pas répondu est redirigé de la même façon — la page cible affiche déjà pour lui un
 * message d'attente en lecture seule plutôt que le formulaire (DecouverteEnLecture).
 */
export function MurDecouverte({ children }: { children: ReactNode }) {
  const { user, pret } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const { statut, decouverte, charger, reinitialiser } = useDecouverteStore();
  const concerne = !!user && (user.role === 'APPRENANT' || user.role === 'PARENT');
  const exempt = ROUTES_EXEMPTES.has(pathname);

  useEffect(() => {
    if (concerne) charger(user!.id);
    else reinitialiser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concerne, user?.id]);

  useEffect(() => {
    if (!pret || !concerne || exempt || statut !== 'pret') return;
    if (!decouverte) router.replace(CIBLE);
  }, [pret, concerne, exempt, statut, decouverte, router]);

  if (pret && concerne && !exempt && (statut !== 'pret' || (statut === 'pret' && !decouverte))) {
    return <Chargement />;
  }
  return <>{children}</>;
}
