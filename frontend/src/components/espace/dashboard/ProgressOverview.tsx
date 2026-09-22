import Link from 'next/link';
import { Compass, Heart, Lightbulb, ListChecks } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { etiquetteProfil, type Decouverte, type Favori, type Preference, type Recommandation } from '@/lib/apprenant';
import { DashboardStat } from './DashboardStat';

interface ProgressOverviewProps {
  prenom: string;
  decouverte: Decouverte | null | undefined;
  recommandations: Recommandation[] | null;
  favoris: Favori[] | null;
  preference: Preference | null | undefined;
  progression: number;
  estParent: boolean;
}

const libelleVoeux = (preference: Preference | null | undefined) =>
  preference === undefined ? '…' : !preference ? 'À préparer' : preference.valideParent ? 'Validés' : 'En attente';

/** Vue d'ensemble : quelques chiffres réels (aucune métrique inventée), plus la lecture qualitative du profil de découverte. */
export function ProgressOverview({ prenom, decouverte, recommandations, favoris, preference, progression, estParent }: ProgressOverviewProps) {
  return (
    <section aria-labelledby="vue-ensemble">
      <SectionHeader
        as="h2"
        id="vue-ensemble"
        eyebrow="Vue d’ensemble"
        title={estParent ? `Avancement de ${prenom}` : 'Ton avancement'}
        className="mb-4v"
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3v md:gap-4v">
        <DashboardStat icon={<ListChecks size={18} aria-hidden="true" />} label="Progression" value={`${progression}%`} hint="du parcours repéré" />
        <DashboardStat
          icon={<Lightbulb size={18} aria-hidden="true" />}
          label="Pistes recommandées"
          value={recommandations?.length ?? '…'}
          href="/espace-apprenant/recommandations"
        />
        <DashboardStat
          icon={<Heart size={18} aria-hidden="true" />}
          label="Formations sauvegardées"
          value={favoris?.length ?? '…'}
          href="/catalogue"
        />
        <DashboardStat icon={<Compass size={18} aria-hidden="true" />} label="Vœux" value={libelleVoeux(preference)} href="/espace-apprenant/preferences" />
      </div>
      {decouverte && (
        <p className="text-sm text-text-secondary mt-4v">
          {/* Pas de « Profil » dans ce libellé : etiquetteProfil() ci-dessous commence déjà par ce mot,
              accoler les deux se lisait comme une répétition (« Profil de découverte : Profil Réaliste… »). */}
          <span className="font-medium text-text">Découverte : </span>
          {etiquetteProfil(decouverte)}{' '}
          <Link href="/espace-apprenant/decouverte" className="text-primary hover:underline whitespace-nowrap">
            Voir le détail →
          </Link>
        </p>
      )}
    </section>
  );
}
