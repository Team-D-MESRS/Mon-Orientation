'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, type Role } from '@/stores/authStore';

/** Réserve une page aux utilisateurs connectés, éventuellement à certains rôles. */
export function RequireAuth({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { user, pret } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pret && !user) {
      router.replace(`/connexion?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [pret, user, router, pathname]);

  if (!pret || !user) {
    return (
      <p className="py-16v text-center text-bj-gray-500" aria-busy="true">
        Chargement…
      </p>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="bj-container py-16v text-center">
        <h1 className="text-2xl font-bold mb-2v">Accès réservé</h1>
        <p className="text-bj-gray-500 mb-6v">Cet espace n&apos;est pas accessible avec ton profil.</p>
        <Link href="/" className="bj-btn bj-btn-secondary">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
