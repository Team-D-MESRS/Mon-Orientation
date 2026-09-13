'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Info, ShieldCheck, AlertTriangle } from 'lucide-react';
import { filiereApi } from '@/lib/api';
import {
  Filiere,
  NIVEAU_LABELS,
  NiveauAcces,
  TYPE_COLORS,
  TYPE_LABELS,
  TypeFiliere,
  aUneSourceOfficielle,
} from '@/lib/filiere';

const LIMITE = 100;

export default function CataloguePage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [niveauFilter, setNiveauFilter] = useState('');
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [total, setTotal] = useState(0);
  const [statut, setStatut] = useState<'chargement' | 'ok' | 'erreur'>('chargement');
  const [tentative, setTentative] = useState(0);

  useEffect(() => {
    let annule = false;
    setStatut('chargement');
    const timer = setTimeout(
      () => {
        filiereApi
          .list({
            search: search.trim() || undefined,
            type: typeFilter || undefined,
            niveau: niveauFilter || undefined,
            limit: LIMITE,
          })
          .then(({ data }) => {
            if (annule) return;
            setFilieres(data.items);
            setTotal(data.total);
            setStatut('ok');
          })
          .catch(() => {
            if (!annule) setStatut('erreur');
          });
      },
      search ? 300 : 0,
    );
    return () => {
      annule = true;
      clearTimeout(timer);
    };
  }, [search, typeFilter, niveauFilter, tentative]);

  return (
    <div className="py-8v">
      <div className="bj-container">
        <h1 className="text-3xl font-bold mb-2v">Catalogue des filières</h1>
        <p className="text-bj-gray-500 mb-6v">
          Explore les formations accessibles après le BEPC et après le baccalauréat au Bénin.
        </p>

        <div className="flex gap-3v items-start p-4v mb-8v rounded-bj-sm border border-bj-blue/30 bg-bj-blue/5 text-sm">
          <Info className="text-bj-blue shrink-0 mt-[2px]" size={18} aria-hidden="true" />
          <p>
            Catalogue constitué à partir de sources publiques, en attente de validation par le Ministère.
            Chaque fiche indique ses sources.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4v mb-8v">
          <div className="flex-1 relative">
            <Search className="absolute left-3v top-1/2 -translate-y-1/2 text-bj-gray-500" size={20} aria-hidden="true" />
            <label htmlFor="recherche" className="sr-only">Rechercher une filière</label>
            <input
              id="recherche"
              type="search"
              placeholder="Rechercher une filière, un métier, une série..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm focus:outline-none focus:ring-2 focus:ring-bj-green"
            />
          </div>
          <label htmlFor="filtre-niveau" className="sr-only">Niveau d&apos;accès</label>
          <select
            id="filtre-niveau"
            value={niveauFilter}
            onChange={(e) => setNiveauFilter(e.target.value)}
            className="px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm focus:outline-none focus:ring-2 focus:ring-bj-green"
          >
            <option value="">Tous les niveaux</option>
            {(Object.keys(NIVEAU_LABELS) as NiveauAcces[]).map((n) => (
              <option key={n} value={n}>{NIVEAU_LABELS[n]}</option>
            ))}
          </select>
          <label htmlFor="filtre-type" className="sr-only">Type de formation</label>
          <select
            id="filtre-type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm focus:outline-none focus:ring-2 focus:ring-bj-green"
          >
            <option value="">Tous les types</option>
            {(Object.keys(TYPE_LABELS) as TypeFiliere[]).map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        {statut === 'erreur' && (
          <div role="alert" className="text-center py-12v">
            <p className="text-bj-gray-500 text-lg mb-4v">Impossible de charger le catalogue pour le moment.</p>
            <button type="button" className="bj-btn bj-btn-secondary" onClick={() => setTentative((n) => n + 1)}>
              Réessayer
            </button>
          </div>
        )}

        {statut === 'chargement' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6v" aria-busy="true" aria-label="Chargement du catalogue">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 rounded-bj-md bg-bj-gray-950 animate-pulse" />
            ))}
          </div>
        )}

        {statut === 'ok' && (
          <>
            <p className="text-sm text-bj-gray-500 mb-6v" aria-live="polite">
              {total} filière(s) trouvée(s)
              {total > filieres.length && ` — ${filieres.length} premières affichées, affine ta recherche`}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6v">
              {filieres.map((filiere) => (
                <Link key={filiere.id} href={`/catalogue/${filiere.id}`} className="bj-card flex flex-col">
                  <div className="p-6v flex-1">
                    <div className="flex items-center justify-between gap-2v mb-3v">
                      <span className={`px-3v py-1v rounded-full text-xs font-medium ${TYPE_COLORS[filiere.type]}`}>
                        {TYPE_LABELS[filiere.type]}
                      </span>
                      {filiere.niveauAcces && (
                        <span className="text-xs text-bj-gray-500">{NIVEAU_LABELS[filiere.niveauAcces]}</span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold mb-2v">{filiere.nom}</h2>
                    {filiere.description && (
                      <p className="text-sm text-bj-gray-500 mb-3v line-clamp-3">{filiere.description}</p>
                    )}
                    {filiere.seriesAdmises && filiere.seriesAdmises.length > 0 && (
                      <p className="text-xs text-bj-gray-625">
                        <span className="font-medium">Séries admises :</span> {filiere.seriesAdmises.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="px-6v py-3v bg-bj-gray-975 border-t border-bj-gray-925 flex items-center justify-between gap-2v">
                    <span className="text-sm font-medium text-bj-green">Voir la fiche →</span>
                    {aUneSourceOfficielle(filiere) ? (
                      <span className="flex items-center gap-1v text-xs text-bj-green">
                        <ShieldCheck size={14} aria-hidden="true" /> Source officielle
                      </span>
                    ) : (
                      <span className="flex items-center gap-1v text-xs text-bj-ochre">
                        <AlertTriangle size={14} aria-hidden="true" /> À confirmer
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {filieres.length === 0 && (
              <div className="text-center py-12v">
                <p className="text-bj-gray-500 text-lg">Aucune filière trouvée pour cette recherche.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
