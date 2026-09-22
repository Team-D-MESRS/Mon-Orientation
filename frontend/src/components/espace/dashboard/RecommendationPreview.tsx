import Link from 'next/link';
import { DOMAINE_LABELS } from '@/lib/filiere';
import type { Recommandation } from '@/lib/apprenant';
import { BadgeType } from '@/components/espace/ui';

interface RecommendationPreviewProps {
  recommandations: Recommandation[];
}

/** Quelques pistes fortes (pas la liste complète) : score, famille de métiers, justification courte. */
export function RecommendationPreview({ recommandations }: RecommendationPreviewProps) {
  return (
    <ul className="space-y-3v">
      {recommandations.map((r) => (
        <li key={r.id}>
          <Link href={`/catalogue/${r.filiere.id}`} className="bj-card bj-card-hoverable flex items-start gap-4v p-4v">
            <span className="w-12 shrink-0 text-center">
              <span className="block text-2xl font-bold text-primary leading-none">{Math.round(r.score)}</span>
              <span className="block text-[11px] text-text-muted">/100</span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2v mb-1v">
                <BadgeType type={r.filiere.type} />
                {r.filiere.domaines[0] && <span className="text-xs text-text-secondary">{DOMAINE_LABELS[r.filiere.domaines[0]]}</span>}
              </div>
              <p className="font-bold">{r.filiere.nom}</p>
              <p className="text-sm text-text-secondary mt-1v line-clamp-2">
                {/* Formulation neutre (ni tu, ni vous) : ce composant est utilisé aussi bien sur le tableau
                    de bord de l'élève que sur celui de son parent, sans distinction du lecteur. */}
                {r.explication || 'Cette formation correspond aux intérêts et au parcours scolaire enregistrés.'}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
