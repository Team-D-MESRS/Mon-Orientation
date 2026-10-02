'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { EspaceProvider, useEspace } from '@/components/espace/EspaceContext';
import { Alerte, CHAMP, Chargement } from '@/components/espace/ui';
import GuidoChat from '@/components/guido/GuidoChat';
import { ButtonLink } from '@/components/ui/Button';

function GuidoConnecte() {
  const { moi, nip, choisirNip, profil, chargementProfil, erreurProfil, estParent } = useEspace();
  const attenteDossier = chargementProfil || (!!nip && !profil && !erreurProfil);

  return (
    <main className="bj-container max-w-5xl py-8v">
      <div className="mb-6v flex flex-col gap-4v md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-3v">
          <Image
            src="/images/guido-mascotte.webp"
            alt=""
            width={64}
            height={64}
            className="shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">Conseiller d’orientation</p>
            <h1 className="font-serif text-3xl font-bold">Guido</h1>
            <p className="mt-1v max-w-2xl text-sm text-text-secondary">
              {estParent
                ? 'Posez vos questions sur les métiers et formations techniques pour votre enfant.'
                : 'Pose tes questions sur les métiers et formations techniques au Bénin.'}
            </p>
          </div>
        </div>
        <Link href="/espace-apprenant" className="inline-flex items-center gap-2v text-sm font-medium text-primary hover:underline">
          <ArrowLeft size={16} aria-hidden="true" /> Retour à mon espace
        </Link>
      </div>

      {estParent && moi.enfants.length > 1 && (
        <div className="mb-4v max-w-sm">
          <label htmlFor="guido-enfant" className="mb-1v block text-sm font-medium">Enfant suivi</label>
          <select
            id="guido-enfant"
            value={nip ?? ''}
            onChange={(event) => choisirNip(event.target.value)}
            className={CHAMP}
          >
            {moi.enfants.map((enfant) => (
              <option key={enfant.nip} value={enfant.nip}>{enfant.prenom} {enfant.nom}</option>
            ))}
          </select>
        </div>
      )}

      {profil && (
        <p className="mb-3v text-sm text-text-secondary">
          {estParent ? `Conversation au sujet de ${profil.prenom}.` : `Bonjour ${profil.prenom}.`}
        </p>
      )}
      {attenteDossier && <Chargement texte="Chargement du dossier…" />}
      {erreurProfil && <Alerte ton="erreur">{erreurProfil}</Alerte>}
      {!attenteDossier && !erreurProfil && !profil && (
        <Alerte ton="info">
          {estParent
            ? 'Aucun enfant n’est rattaché à ce compte pour le moment. L’établissement doit d’abord rattacher le dossier.'
            : 'Aucun dossier élève n’est associé à ce compte pour le moment.'}
        </Alerte>
      )}
      {profil && !attenteDossier && <GuidoChat />}
      <p className="mt-4v text-xs text-text-secondary">
        {estParent
          ? 'Guido donne des renseignements généraux. Vérifiez les informations importantes auprès de votre établissement et ne saisissez pas de données personnelles dans vos questions.'
          : 'Guido donne des renseignements généraux. Vérifie les informations importantes auprès de ton établissement et ne saisis pas de données personnelles dans tes questions.'}
      </p>
    </main>
  );
}

export default function ConseillerAccueilPage() {
  const { user, pret } = useAuthStore();

  if (!pret) {
    return <div className="bj-container py-16v"><Chargement /></div>;
  }

  if (user?.role === 'APPRENANT' || user?.role === 'PARENT') {
    return <EspaceProvider><GuidoConnecte /></EspaceProvider>;
  }

  if (user) {
    return (
      <main className="bj-container max-w-3xl py-12v">
        <Alerte ton="info">Guido est accessible aux élèves et à leurs parents connectés, depuis cette page.</Alerte>
      </main>
    );
  }

  return (
    <main className="bj-container max-w-3xl py-12v">
      <div className="flex items-center gap-4v">
        <Image src="/images/guido-mascotte.webp" alt="" width={72} height={72} aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">Conseiller d’orientation</p>
          <h1 className="font-serif text-3xl font-bold">Guido, ton guide des métiers techniques</h1>
        </div>
      </div>
      <p className="mt-4v text-text-secondary">
        Guido répond aux questions générales sur les métiers et les formations techniques au Bénin, notamment dans les LTP, LTA et EFMS.
      </p>
      <ul className="my-6v list-disc space-y-2v pl-5 text-sm">
        <li>Il ne consulte ni le dossier scolaire ni les notes de l’élève.</li>
        <li>Pour confirmer les conditions d’accès ou les inscriptions, vérifie auprès de l’établissement concerné.</li>
        <li>Le chat est réservé aux élèves et à leurs parents connectés.</li>
      </ul>
      <ButtonLink href={`/identification?redirect=${encodeURIComponent('/conseiller')}`}>
        S&apos;identifier pour échanger avec Guido
      </ButtonLink>
    </main>
  );
}
