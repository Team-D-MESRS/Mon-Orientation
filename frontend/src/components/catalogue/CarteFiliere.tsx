import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import {
  DOMAINE_LABELS,
  NIVEAU_LABELS,
  TYPE_COLORS,
  TYPE_LABELS,
  aUneSourceOfficielle,
  type AccesSerie,
  type Filiere,
} from '@/lib/filiere';
import { BoutonComparer } from './BoutonComparer';
import { BoutonFavori } from './BoutonFavori';

export function BadgeAcces({ acces }: { acces: AccesSerie }) {
  return acces === 'ADMISE' ? (
    <span className="inline-flex items-center gap-1v text-xs font-medium text-bj-green">
      <CheckCircle2 size={14} aria-hidden="true" /> Série admise
    </span>
  ) : (
    <span className="inline-flex items-center gap-1v text-xs font-medium text-bj-ochre-fonce">
      <AlertTriangle size={14} aria-hidden="true" /> Admise sous conditions
    </span>
  );
}

/** Carte du catalogue : le titre mène à la fiche (lien étendu à toute la carte), les boutons restent cliquables. */
export function CarteFiliere({ filiere }: { filiere: Filiere }) {
  return (
    <article className="bj-card relative flex flex-col">
      <div className="p-6v flex-1">
        <div className="flex items-center justify-between gap-2v mb-3v">
          <span className={`px-3v py-1v rounded-full text-xs font-medium ${TYPE_COLORS[filiere.type]}`}>{TYPE_LABELS[filiere.type]}</span>
          {filiere.niveauAcces && <span className="text-xs text-bj-gray-500">{NIVEAU_LABELS[filiere.niveauAcces]}</span>}
        </div>
        <h2 className="text-lg font-bold mb-2v">
          <Link
            href={`/catalogue/${filiere.id}`}
            className="after:absolute after:inset-0 after:rounded-bj-md hover:text-bj-green focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-bj-green"
          >
            {filiere.nom}
          </Link>
        </h2>
        {filiere.accesSerie && (
          <p className="mb-2v">
            <BadgeAcces acces={filiere.accesSerie} />
          </p>
        )}
        {filiere.description && <p className="text-sm text-bj-gray-500 mb-3v line-clamp-3">{filiere.description}</p>}
        {filiere.seriesAdmises && filiere.seriesAdmises.length > 0 && (
          <p className="text-xs text-bj-gray-625">
            <span className="font-medium">Séries admises :</span> {filiere.seriesAdmises.join(', ')}
          </p>
        )}
        {filiere.domaines.length > 0 && (
          <p className="text-xs text-bj-gray-500 mt-2v">{filiere.domaines.map((d) => DOMAINE_LABELS[d]).join(' · ')}</p>
        )}
      </div>
      <div className="px-6v py-2v bg-bj-gray-975 border-t border-bj-gray-925 flex items-center justify-between gap-2v">
        {aUneSourceOfficielle(filiere) ? (
          <span className="flex items-center gap-1v text-xs text-bj-green">
            <ShieldCheck size={14} aria-hidden="true" /> Source officielle
          </span>
        ) : (
          <span className="flex items-center gap-1v text-xs text-bj-ochre-fonce">
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
