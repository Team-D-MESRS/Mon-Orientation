'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore, type Role } from '@/stores/authStore';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';

/** Réserve une page aux utilisateurs connectés, éventuellement à certains rôles. */
export function RequireAuth({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { user, pret } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pret && !user) {
      router.replace(`/identification?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [pret, user, router, pathname]);

  if (!pret || !user) {
    return (
      <div className="bj-container py-16v">
        <LoadingState />
      </div>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="bj-container py-16v">
        <EmptyState
          icon={<ShieldAlert size={22} aria-hidden="true" />}
          title="Accès réservé"
          description="Cet espace n’est pas accessible avec ton profil."
          action={<ButtonLink href="/">Retour à l’accueil</ButtonLink>}
        />
      </div>
    );
  }

  return <>{children}</>;
}
