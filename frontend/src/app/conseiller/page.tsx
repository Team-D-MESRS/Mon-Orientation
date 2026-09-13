'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot } from 'lucide-react';
import { Alerte } from '@/components/espace/ui';
import { useAuthStore } from '@/stores/authStore';

const CIBLE = '/espace-apprenant/conseiller';

/** Présentation du conseiller ; les élèves et les parents connectés sont envoyés directement vers leur espace. */
export default function ConseillerAccueilPage() {
  const router = useRouter();
  const { user, pret } = useAuthStore();
  const accesDirect = !!user && (user.role === 'APPRENANT' || user.role === 'PARENT');

  useEffect(() => {
    if (pret && accesDirect) router.replace(CIBLE);
  }, [pret, accesDirect, router]);

  if (!pret || accesDirect) {
    return (
      <p className="py-16v text-center text-bj-gray-500" aria-busy="true">
        Chargement…
      </p>
    );
  }

  return (
    <div className="py-8v">
      <div className="bj-container max-w-3xl">
        <div className="flex items-center gap-3v mb-2v">
          <Bot size={28} className="text-bj-green" aria-hidden="true" />
          <h1 className="text-3xl font-bold">Conseiller pédagogique</h1>
        </div>
        <p className="text-bj-gray-500 mb-6v">
          Un assistant qui répond aux questions sur les formations et les métiers, et qui explique les propositions
          d&apos;orientation faites à partir du dossier scolaire de l&apos;élève.
        </p>
        <ul className="list-disc pl-5 space-y-2v mb-8v text-sm">
          <li>Il s&apos;appuie uniquement sur le catalogue officiel des formations et sur le dossier de l&apos;élève.</li>
          <li>Il explique les propositions du moteur d&apos;orientation ; il ne décide pas à la place de l&apos;élève et de sa famille.</li>
          <li>Il est accessible aux élèves et à leurs parents, depuis leur espace personnel.</li>
        </ul>
        {user ? (
          <Alerte ton="info">Le conseiller est réservé aux élèves et à leurs parents.</Alerte>
        ) : (
          <Link href={`/connexion?redirect=${encodeURIComponent(CIBLE)}`} className="bj-btn bj-btn-primary">
            Se connecter pour échanger avec le conseiller
          </Link>
        )}
      </div>
    </div>
  );
}
