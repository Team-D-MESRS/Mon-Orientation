'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useDecouverteStore } from '@/stores/decouverteStore';
import { Chargement } from '@/components/espace/ui';

const CIBLE = '/espace-apprenant/decouverte';

/**
 * Pages joignables par un élève/parent connecté sans questionnaire de découverte rempli : accueil,
 * identification, pages publiques d'information, et le questionnaire lui-même (sinon boucle
 * infinie). Tout le reste — dont /catalogue et le reste de /espace-apprenant — affiche un message de
 * blocage à la place du contenu (décisions du 18/09 : le test devient le point d'entrée central,
 * avant toute autre page ; 19/09 : un message explicite avec un bouton plutôt qu'une redirection
 * automatique — l'utilisateur doit comprendre pourquoi il ne peut pas accéder à la page demandée).
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
 * Garde-fou de routage global : sur toute page non exemptée, affiche un message de blocage (avec un
 * bouton vers le questionnaire) tant que le dossier de l'élève/parent connecté n'a pas de
 * questionnaire de découverte rempli. Un parent dont l'enfant n'a pas répondu voit le même message
 * — la page du questionnaire lui affiche déjà, elle, une lecture seule plutôt qu'un formulaire
 * (DecouverteEnLecture).
 */
export function MurDecouverte({ children }: { children: ReactNode }) {
  const { user, pret } = useAuthStore();
  const pathname = usePathname();
  const { statut, decouverte, charger, reinitialiser } = useDecouverteStore();
  const concerne = !!user && (user.role === 'APPRENANT' || user.role === 'PARENT');
  const exempt = ROUTES_EXEMPTES.has(pathname);

  useEffect(() => {
    if (concerne) charger(user!.id);
    else reinitialiser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concerne, user?.id]);

  if (pret && concerne && !exempt) {
    if (statut !== 'pret') return <Chargement />;
    if (!decouverte) return <BlocageDecouverte />;
  }
  return <>{children}</>;
}

function BlocageDecouverte() {
  return (
    <div className="bj-container py-16v text-center">
      <Compass size={32} className="text-bj-green mx-auto mb-3v" aria-hidden="true" />
      <h1 className="text-xl font-bold mb-2v">Cette fonctionnalité n&apos;est pas encore accessible</h1>
      <p className="text-bj-gray-500 max-w-md mx-auto mb-6v">
        Le questionnaire de découverte doit d&apos;abord être rempli pour débloquer le reste de la plateforme.
      </p>
      <Link href={CIBLE} className="bj-btn bj-btn-primary">
        Aller au questionnaire de découverte
      </Link>
    </div>
  );
}
