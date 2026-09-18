'use client';

import Link from 'next/link';
import { accueilDuRole, useAuthStore } from '@/stores/authStore';

/** Visiteur : s'identifier avec EducMaster ; utilisateur connecté : accès direct à son espace. */
export function ActionsHero() {
  const { user, pret } = useAuthStore();

  if (pret && user) {
    const pilotage = user.role === 'DGES' || user.role === 'ADMIN';
    return (
      <div className="flex flex-wrap items-center gap-3v">
        <Link href={accueilDuRole(user.role)} className="bj-btn bj-btn-secondary">
          {pilotage ? 'Tableau de bord' : 'Mon espace'}
        </Link>
        <span className="text-sm text-bj-gray-500">Bonjour {user.prenom}&nbsp;!</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4v gap-y-3v">
      <Link href="/identification" className="bj-btn bj-btn-secondary">
        S&apos;identifier
      </Link>
      <p className="text-sm text-bj-gray-500">
        Avec tes identifiants EducMaster.
      </p>
    </div>
  );
}
