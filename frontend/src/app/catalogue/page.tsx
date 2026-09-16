'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Info, RotateCcw, Search } from 'lucide-react';
import { authApi, filiereApi, type ParametresCatalogue } from '@/lib/api';
import { NIVEAU_LABELS, TYPE_LABELS, type Filiere, type NiveauAcces, type TypeFiliere, type ValeursFiltres } from '@/lib/filiere';
import { useAuthStore } from '@/stores/authStore';
import { useFavoris } from '@/stores/favorisStore';
import { CarteFiliere } from '@/components/catalogue/CarteFiliere';
import { Alerte } from '@/components/espace/ui';

/** Formations chargées à la fois ; « Afficher plus » charge la page suivante */
const LIMITE = 48;
const CHAMP = 'w-full px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-bj-green';

/** Filtres portés par l'adresse de la page : une recherche filtrée se partage par simple lien. */
const CLES = ['q', 'niveau', 'type', 'domaine', 'serie', 'bourses', 'officielle'] as const;
type Cle = (typeof CLES)[number];

function requeteDepuis(chaine: string): ParametresCatalogue {
  const p = new URLSearchParams(chaine);
  return {
    search: p.get('q') || undefined,
    niveau: p.get('niveau') || undefined,
    type: p.get('type') || undefined,
    domaine: p.get('domaine') || undefined,
    serie: p.get('serie') || undefined,
    bourses: p.get('bourses') === 'true' || undefined,
    officielle: p.get('officielle') === 'true' || undefined,
    limit: LIMITE,
  };
}

export default function CataloguePage() {
  return (
    <Suspense fallback={<Squelette />}>
      <Catalogue />
    </Suspense>
  );
}

function Squelette() {
  return (
    <div className="bj-container py-8v grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6v" aria-busy="true" aria-label="Chargement du catalogue">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-56 rounded-bj-md bg-bj-gray-950 animate-pulse" />
      ))}
    </div>
  );
}

function Catalogue() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const cleRequete = params.toString();
  const requete = useMemo(() => requeteDepuis(cleRequete), [cleRequete]);
  const q = params.get('q') ?? '';
  const serie = params.get('serie') ?? '';

  const [saisie, setSaisie] = useState(q);
  const [valeurs, setValeurs] = useState<ValeursFiltres | null>(null);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [total, setTotal] = useState(0);
  const [statut, setStatut] = useState<'chargement' | 'ok' | 'erreur'>('chargement');
  const [tentative, setTentative] = useState(0);
  const [page, setPage] = useState(1);
  const [suite, setSuite] = useState<'repos' | 'chargement' | 'erreur'>('repos');
  const [maSerie, setMaSerie] = useState<string | null>(null);
  const role = useAuthStore((s) => s.user?.role);
  const { erreur: erreurFavoris } = useFavoris();

  // Lu dans l'adresse au moment du changement : un filtre modifié pendant la saisie n'est pas écrasé
  const modifier = (changements: Partial<Record<Cle, string>>) => {
    const suivants = new URLSearchParams(window.location.search);
    for (const [cle, valeur] of Object.entries(changements)) {
      if (valeur) suivants.set(cle, valeur);
      else suivants.delete(cle);
    }
    const chaine = suivants.toString();
    router.replace(chaine ? `${pathname}?${chaine}` : pathname, { scroll: false });
  };

  const effacer = () => {
    setSaisie('');
    router.replace(pathname, { scroll: false });
  };

  // Saisie → adresse, après une courte pause
  useEffect(() => {
    if (saisie.trim() === q) return;
    const minuteur = setTimeout(() => modifier({ q: saisie.trim() }), 300);
    return () => clearTimeout(minuteur);
  }, [saisie, q]);

  // Adresse → saisie (filtres effacés, lien ouvert, retour arrière)
  useEffect(() => {
    setSaisie((actuelle) => (actuelle.trim() === q ? actuelle : q));
  }, [q]);

  useEffect(() => {
    filiereApi
      .filtres()
      .then(({ data }) => setValeurs(data))
      .catch(() => setValeurs({ domaines: [], series: [] }));
  }, []);

  // Élève de Première ou de Terminale : raccourci vers les formations accessibles avec sa série
  useEffect(() => {
    if (role !== 'APPRENANT') {
      setMaSerie(null);
      return;
    }
    authApi
      .moi()
      .then(({ data }) => {
        const eleve = data.apprenant;
        setMaSerie(eleve?.serie && (eleve.palier === 'PREMIERE' || eleve.palier === 'TERMINALE') ? eleve.serie : null);
      })
      .catch(() => setMaSerie(null));
  }, [role]);

  useEffect(() => {
    let annule = false;
    setStatut('chargement');
    setSuite('repos');
    filiereApi
      .list(requete)
      .then(({ data }) => {
        if (annule) return;
        setFilieres(data.items);
        setTotal(data.total);
        setPage(1);
        setStatut('ok');
      })
      .catch(() => {
        if (!annule) setStatut('erreur');
      });
    return () => {
      annule = true;
    };
  }, [requete, tentative]);

  const afficherPlus = async () => {
    setSuite('chargement');
    try {
      const { data } = await filiereApi.list({ ...requete, page: page + 1 });
      setFilieres((actuelles) => [...actuelles, ...data.items]);
      setPage(page + 1);
      setSuite('repos');
    } catch {
      setSuite('erreur');
    }
  };

  const filtresActifs = CLES.some((cle) => params.get(cle));
  const serieChoisie = valeurs?.series.find((s) => s.serie === serie);
  const raccourci = maSerie && maSerie !== serie ? valeurs?.series.find((s) => s.serie === maSerie) : undefined;
  const groupesSeries: [string, ValeursFiltres['series']][] = [
    ['Séries générales', valeurs?.series.filter((s) => s.type === 'GENERALE') ?? []],
    ['Séries techniques', valeurs?.series.filter((s) => s.type !== 'GENERALE') ?? []],
  ];

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

        <div className="space-y-3v mb-8v">
          <div className="relative">
            <Search className="absolute left-3v top-1/2 -translate-y-1/2 text-bj-gray-500" size={20} aria-hidden="true" />
            <label htmlFor="recherche" className="sr-only">Rechercher une filière</label>
            <input
              id="recherche"
              type="search"
              placeholder="Formation, métier, ville…"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              className={`${CHAMP} pl-10`}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3v">
            <div>
              <label htmlFor="filtre-niveau" className="sr-only">Niveau d&apos;accès</label>
              <select
                id="filtre-niveau"
                value={params.get('niveau') ?? ''}
                onChange={(e) => modifier({ niveau: e.target.value, ...(e.target.value !== 'APRES_BAC' ? { serie: '' } : {}) })}
                className={CHAMP}
              >
                <option value="">Tous les niveaux</option>
                {(Object.keys(NIVEAU_LABELS) as NiveauAcces[]).map((n) => (
                  <option key={n} value={n}>{NIVEAU_LABELS[n]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filtre-type" className="sr-only">Type de formation</label>
              <select id="filtre-type" value={params.get('type') ?? ''} onChange={(e) => modifier({ type: e.target.value })} className={CHAMP}>
                <option value="">Tous les types</option>
                {(Object.keys(TYPE_LABELS) as TypeFiliere[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filtre-domaine" className="sr-only">Domaine</label>
              <select id="filtre-domaine" value={params.get('domaine') ?? ''} onChange={(e) => modifier({ domaine: e.target.value })} className={CHAMP}>
                <option value="">Tous les domaines</option>
                {valeurs?.domaines.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.libelle} ({d.total})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filtre-serie" className="sr-only">Série de bac</label>
              <select
                id="filtre-serie"
                value={serie}
                onChange={(e) => modifier({ serie: e.target.value, ...(e.target.value ? { niveau: 'APRES_BAC' } : {}) })}
                className={CHAMP}
              >
                <option value="">Accessible avec mon bac…</option>
                {groupesSeries.map(
                  ([titre, series]) =>
                    series.length > 0 && (
                      <optgroup key={titre} label={titre}>
                        {series.map((s) => (
                          <option key={s.serie} value={s.serie}>
                            Bac {s.serie} — {s.libelle}
                          </option>
                        ))}
                      </optgroup>
                    ),
                )}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6v gap-y-3v">
            <label className="inline-flex items-center gap-2v text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={params.get('bourses') === 'true'}
                onChange={(e) => modifier({ bourses: e.target.checked ? 'true' : '' })}
                className="w-4 h-4 accent-bj-green"
              />
              Avec bourses
            </label>
            <label className="inline-flex items-center gap-2v text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={params.get('officielle') === 'true'}
                onChange={(e) => modifier({ officielle: e.target.checked ? 'true' : '' })}
                className="w-4 h-4 accent-bj-green"
              />
              Source officielle uniquement
            </label>
            {raccourci && (
              <button
                type="button"
                onClick={() => modifier({ serie: raccourci.serie, niveau: 'APRES_BAC' })}
                className="inline-flex items-center gap-2v px-3v py-2v rounded-full border border-bj-green text-sm font-medium text-bj-green hover:bg-bj-green/5"
              >
                <GraduationCap size={16} aria-hidden="true" /> Que faire avec mon bac {raccourci.serie} ?
              </button>
            )}
            {filtresActifs && (
              <button type="button" onClick={effacer} className="inline-flex items-center gap-1v text-sm font-medium text-bj-green hover:underline">
                <RotateCcw size={14} aria-hidden="true" /> Effacer les filtres
              </button>
            )}
          </div>
        </div>

        {serieChoisie && (
          <div role="note" className="flex gap-3v items-start p-4v mb-6v rounded-bj-sm border border-bj-green/30 bg-bj-green/5 text-sm">
            <GraduationCap className="text-bj-green shrink-0 mt-[2px]" size={18} aria-hidden="true" />
            <p>
              Formations du supérieur accessibles avec un <strong>bac {serieChoisie.serie}</strong> ({serieChoisie.libelle}). Seules les
              formations dont les séries admises sont connues apparaissent : vérifie toujours les conditions sur la fiche.
            </p>
          </div>
        )}

        {erreurFavoris && <Alerte ton="erreur">{erreurFavoris}</Alerte>}

        {statut === 'erreur' && (
          <div role="alert" className="text-center py-12v">
            <p className="text-bj-gray-500 text-lg mb-4v">Impossible de charger le catalogue pour le moment.</p>
            <div className="flex flex-wrap justify-center gap-3v">
              <button type="button" className="bj-btn bj-btn-secondary" onClick={() => setTentative((n) => n + 1)}>
                Réessayer
              </button>
              {filtresActifs && (
                <button type="button" className="bj-btn bj-btn-secondary" onClick={effacer}>
                  Effacer les filtres
                </button>
              )}
            </div>
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
              {total > filieres.length && ` — ${filieres.length} affichées`}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6v">
              {filieres.map((filiere) => (
                <CarteFiliere key={filiere.id} filiere={filiere} />
              ))}
            </div>

            {filieres.length < total && (
              <div className="mt-8v text-center">
                <button type="button" onClick={afficherPlus} disabled={suite === 'chargement'} className="bj-btn bj-btn-secondary disabled:opacity-60">
                  {suite === 'chargement' ? 'Chargement…' : `Afficher plus de formations (${total - filieres.length} restantes)`}
                </button>
                {suite === 'erreur' && (
                  <p role="alert" className="mt-3v text-sm text-bj-red">
                    Impossible de charger la suite pour le moment. Réessaie.
                  </p>
                )}
              </div>
            )}

            {filieres.length === 0 && (
              <div className="text-center py-12v">
                <p className="text-bj-gray-500 text-lg mb-4v">Aucune filière trouvée pour cette recherche.</p>
                {filtresActifs && (
                  <button type="button" className="bj-btn bj-btn-secondary" onClick={effacer}>
                    Effacer les filtres
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
