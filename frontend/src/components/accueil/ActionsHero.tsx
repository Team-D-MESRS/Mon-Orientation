'use client';

import { accueilDuRole, useAuthStore } from '@/stores/authStore';
import { ButtonLink } from '@/components/ui/Button';

/** Visiteur : s'identifier avec EducMaster ; utilisateur connecté : accès direct à son espace. */
export function ActionsHero() {
  const { user, pret } = useAuthStore();

  if (pret && user) {
    const pilotage = user.role === 'DGES' || user.role === 'ADMIN';
    return (
      <div className="flex flex-wrap items-center gap-3v">
        <ButtonLink href={accueilDuRole(user.role)} variant="secondary">
          {pilotage ? 'Tableau de bord' : 'Mon espace'}
        </ButtonLink>
        <span className="text-sm text-text-secondary">Bonjour {user.prenom}&nbsp;!</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4v gap-y-3v">
      <ButtonLink href="/identification" variant="secondary">
        S&apos;identifier
      </ButtonLink>
      <p className="text-sm text-text-secondary">
        Avec tes identifiants EducMaster.
      </p>
    </div>
  );
}
