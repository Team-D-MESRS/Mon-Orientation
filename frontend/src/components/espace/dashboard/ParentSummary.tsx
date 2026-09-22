import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { Decouverte, Preference, Recommandation } from '@/lib/apprenant';

interface ParentSummaryProps {
  prenom: string;
  decouverte: Decouverte | null | undefined;
  recommandations: Recommandation[] | null;
  preference: Preference | null | undefined;
}

/**
 * Contenu réservé au parent : pas la même chose que la vue élève (les chiffres bruts sont déjà dans
 * ProgressOverview, commun aux deux) — ici, ce qui mérite une conversation, dérivé du vrai état du
 * dossier, jamais d'une liste figée.
 */
export function ParentSummary({ prenom, decouverte, recommandations, preference }: ParentSummaryProps) {
  const points: { texte: string; href: string }[] = [];
  if (!decouverte) {
    points.push({ texte: `${prenom} n’a pas encore rempli son profil de découverte.`, href: '/espace-apprenant/decouverte' });
  }
  if (preference && !preference.valideParent) {
    points.push({ texte: `Les vœux de ${prenom} attendent votre validation.`, href: '/espace-apprenant/preferences' });
  }
  if (decouverte && recommandations !== null && recommandations.length === 0) {
    points.push({ texte: 'Aucune piste n’a encore été calculée pour l’instant.', href: '/espace-apprenant/recommandations' });
  }

  return (
    <section className="rounded-bj-lg border border-info/25 bg-info-soft p-6v" aria-labelledby="synthese-parent">
      <SectionHeader as="h2" id="synthese-parent" eyebrow={`Pour accompagner ${prenom}`} title="À regarder ensemble" className="mb-4v" />
      {points.length === 0 ? (
        <p className="flex items-start gap-2v text-sm text-text-secondary mb-4v">
          <CheckCircle2 size={16} className="text-success shrink-0 mt-[2px]" aria-hidden="true" />
          Rien de particulier n’attend votre attention pour l’instant : le parcours avance normalement.
        </p>
      ) : (
        <ul className="space-y-2v mb-4v">
          {points.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="flex items-center gap-2v text-sm rounded-bj-sm border border-border bg-surface p-3v transition-colors hover:border-info">
                <AlertTriangle size={16} className="text-warning-strong shrink-0" aria-hidden="true" />
                <span className="flex-1">{p.texte}</span>
                <ArrowRight size={14} className="text-text-muted shrink-0" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-3v">
        <ButtonLink href="/espace-apprenant/conseiller" variant="secondary" size="sm">
          Demander une explication à Guido
        </ButtonLink>
        <ButtonLink href="/espace-apprenant/preferences" variant="ghost" size="sm">
          Voir les vœux
        </ButtonLink>
      </div>
    </section>
  );
}
