'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const CIBLE = '/espace-apprenant/decouverte';
const LIEN = 'inline-flex items-center gap-1v mt-8v text-sm font-medium text-bj-green hover:underline';

/** Visiteur : redirigé vers l'identification, avant de revenir ici ; élève connecté : accès direct au questionnaire. */
export function CTADecouverte() {
  const { user, pret } = useAuthStore();

  if (pret && user?.role === 'APPRENANT') {
    return (
      <Link href={CIBLE} className={LIEN}>
        Passer le test de découverte <ArrowRight size={14} aria-hidden="true" />
      </Link>
    );
  }
  if (pret && user?.role === 'PARENT') {
    return (
      <Link href={CIBLE} className={LIEN}>
        Voir le questionnaire de découverte de mon enfant <ArrowRight size={14} aria-hidden="true" />
      </Link>
    );
  }
  if (pret && user) return null;

  return (
    <Link href={`/identification?redirect=${encodeURIComponent(CIBLE)}`} className={LIEN}>
      Se connecter pour passer le test de découverte <ArrowRight size={14} aria-hidden="true" />
    </Link>
  );
}
