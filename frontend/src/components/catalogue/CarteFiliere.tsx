import Link from 'next/link';
import { AlertTriangle, CheckCircle2, School, ShieldCheck } from 'lucide-react';
import {
  DOMAINE_LABELS,
  NIVEAU_LABELS,
  NIVEAU_TONES,
  TYPE_LABELS,
  TYPE_TONES,
  aUneSourceOfficielle,
  type AccesSerie,
  type Filiere,
} from '@/lib/filiere';
import { Badge } from '@/components/ui/Badge';
import { BoutonComparer } from './BoutonComparer';
import { BoutonFavori } from './BoutonFavori';

export function BadgeAcces({ acces }: { acces: AccesSerie }) {
  return acces === 'ADMISE' ? (
    <span className="inline-flex items-center gap-1v text-xs font-medium text-primary">
      <CheckCircle2 size={14} aria-hidden="true" /> Série admise
    </span>
  ) : (
    <span className="inline-flex items-center gap-1v text-xs font-medium text-terre-strong">
      <AlertTriangle size={14} aria-hidden="true" /> Admise sous conditions
    </span>
  );
}

const MAX_DOMAINES_AFFICHES = 2;

/**
 * Carte du catalogue : le titre mène à la fiche (lien étendu à toute la carte), les boutons restent
 * cliquables. Hiérarchie voulue : type + niveau (classification, en petit) → titre (le plus visible) →
 * domaine(s) et établissement (repères rapides, en badges) → description → pied de carte (confiance dans
 * la source, puis actions). Pas de badge « durée » : cette donnée n'existe que sur la fiche détaillée
 * (établissements/DTM), pas dans la réponse de liste du catalogue — l'inventer ici serait afficher une
 * information non garantie.
 */
export function CarteFiliere({ filiere }: { filiere: Filiere }) {
  const domainesAffiches = filiere.domaines.slice(0, MAX_DOMAINES_AFFICHES);
  const domainesRestants = filiere.domaines.length - domainesAffiches.length;

  return (
    <article className="bj-card bj-card-hoverable relative flex flex-col">
      <div className="p-6v flex-1">
        <div className="flex items-center flex-wrap gap-2v mb-3v">
          <Badge ton={TYPE_TONES[filiere.type]}>{TYPE_LABELS[filiere.type]}</Badge>
          {filiere.niveauAcces && (
            <Badge ton={NIVEAU_TONES[filiere.niveauAcces]} variant="outline">
              {NIVEAU_LABELS[filiere.niveauAcces]}
            </Badge>
          )}
        </div>

        <h2 className="text-lg font-bold leading-snug mb-2v">
          <Link
            href={`/catalogue/${filiere.id}`}
            className="after:absolute after:inset-0 after:rounded-bj-md hover:text-primary focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary"
          >
            {filiere.nom}
          </Link>
        </h2>

        {filiere.accesSerie && (
          <p className="mb-2v">
            <BadgeAcces acces={filiere.accesSerie} />
          </p>
        )}

        {filiere.description && <p className="text-sm text-text-secondary mb-3v line-clamp-3">{filiere.description}</p>}

        {filiere.seriesAdmises && filiere.seriesAdmises.length > 0 && (
          <p className="text-xs text-text-muted mb-2v">
            <span className="font-medium">Séries admises :</span> {filiere.seriesAdmises.join(', ')}
          </p>
        )}

        <div className="flex flex-wrap gap-1v mt-2v">
          {domainesAffiches.map((d) => (
            <Badge key={d} ton="neutre">
              {DOMAINE_LABELS[d]}
            </Badge>
          ))}
          {domainesRestants > 0 && <Badge ton="neutre">+{domainesRestants}</Badge>}
          {filiere.etablissement && (
            <Badge ton="neutre" icon={<School size={12} aria-hidden="true" />}>
              {filiere.etablissement.sigle ?? filiere.etablissement.nom}
            </Badge>
          )}
        </div>
      </div>
      <div className="px-6v py-2v bg-background border-t border-border flex items-center justify-between gap-2v">
        {aUneSourceOfficielle(filiere) ? (
          <span className="flex items-center gap-1v text-xs text-primary">
            <ShieldCheck size={14} aria-hidden="true" /> Source officielle
          </span>
        ) : (
          <span className="flex items-center gap-1v text-xs text-terre-strong">
            <AlertTriangle size={14} aria-hidden="true" /> À confirmer
          </span>
        )}
        <div className="relative z-10 flex items-center gap-1v">
          <BoutonFavori filiere={filiere} compact />
          <BoutonComparer filiere={filiere} />
        </div>
      </div>
    </article>
  );
}
