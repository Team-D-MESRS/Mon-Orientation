import { ArrowRight, CheckCircle2, Compass } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';

interface NextActionCardProps {
  titre: string;
  justification: string;
  actionLabel: string;
  href: string;
  /** Vrai quand les 4 étapes du parcours sont avancées : il n'y a plus d'étape manquante à proposer. */
  parcoursComplet?: boolean;
}

/**
 * Carte dominante de la page : une seule action prioritaire, sa raison d'être, un bouton au verbe
 * précis. Distincte du bouton compact du DashboardHero (même destination, mais ici expliquée).
 */
export function NextActionCard({ titre, justification, actionLabel, href, parcoursComplet }: NextActionCardProps) {
  if (parcoursComplet) {
    return (
      <section
        className="rounded-bj-lg border border-success/30 bg-success-soft p-6v md:p-8v"
        aria-labelledby="prochaine-etape"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5v">
          <span className="w-12 h-12 rounded-full bg-success text-text-on-primary flex items-center justify-center shrink-0" aria-hidden="true">
            <CheckCircle2 size={24} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-success mb-1v">Parcours à jour</p>
            <h2 id="prochaine-etape" className="text-xl md:text-2xl font-bold mb-2v">
              {titre}
            </h2>
            <p className="text-text-secondary max-w-2xl">{justification}</p>
          </div>
          <ButtonLink href={href} variant="secondary" iconRight={<ArrowRight size={16} aria-hidden="true" />} className="shrink-0">
            {actionLabel}
          </ButtonLink>
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-bj-lg border border-primary/30 bg-gradient-to-br from-primary-soft via-surface to-surface p-6v md:p-8v"
      aria-labelledby="prochaine-etape"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-6v">
        <Compass size={28} className="text-primary shrink-0 hidden sm:block" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary mb-2v">Votre prochaine étape</p>
          <h2 id="prochaine-etape" className="text-2xl md:text-3xl font-bold mb-2v">
            {titre}
          </h2>
          <p className="text-text-secondary max-w-xl">{justification}</p>
        </div>
        <ButtonLink href={href} size="lg" iconRight={<ArrowRight size={18} aria-hidden="true" />} className="shrink-0">
          {actionLabel}
        </ButtonLink>
      </div>
    </section>
  );
}
