'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Compass, Filter, GraduationCap, Info, Search, SlidersHorizontal, X } from 'lucide-react';
import { authApi, filiereApi, type ParametresCatalogue } from '@/lib/api';
import { DOMAINE_LABELS, NIVEAU_LABELS, TYPE_LABELS, type Domaine, type Filiere, type NiveauAcces, type TypeFiliere, type ValeursFiltres } from '@/lib/filiere';
import { domaineDominant } from '@/lib/apprenant';
import { useAuthStore } from '@/stores/authStore';
import { useDecouverteStore } from '@/stores/decouverteStore';
import { useFavoris } from '@/stores/favorisStore';
import { CarteFiliere } from '@/components/catalogue/CarteFiliere';
import { Alerte, CHAMP } from '@/components/espace/ui';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonGrid } from '@/components/ui/LoadingState';

/** Formations chargées à la fois ; « Afficher plus » charge la page suivante */
const LIMITE = 48;

/** Filtres portés par l'adresse de la page : une recherche filtrée se partage par simple lien. */
const CLES = ['q', 'niveau', 'type', 'domaine', 'departement', 'serie', 'bourses', 'officielle'] as const;
type Cle = (typeof CLES)[number];
/** Repliés par défaut sous « Plus de filtres » : moins de choix visibles d'emblée, pour ne pas donner
 * l'impression d'un formulaire administratif. Dépliés automatiquement si l'un d'eux est déjà actif
 * (lien partagé, retour arrière). */
const CLES_SECONDAIRES: Cle[] = ['type', 'departement', 'serie', 'bourses', 'officielle'];

function requeteDepuis(chaine: string): ParametresCatalogue {
  const p = new URLSearchParams(chaine);
  return {
    search: p.get('q') || undefined,
    niveau: p.get('niveau') || undefined,
    type: p.get('type') || undefined,
    domaine: p.get('domaine') || undefined,
    departement: p.get('departement') || undefined,
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
    <div className="py-8v">
      <div className="bj-container">
        <div className="h-8 w-64 rounded-bj-sm bg-surface-sunken skeleton-pulse mb-3v" />
        <div className="h-12 rounded-bj-sm bg-surface-sunken skeleton-pulse mb-8v max-w-xl" />
        <SkeletonGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6v" />
      </div>
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
  const { statut: statutMur, decouverte, nip: nipMur } = useDecouverteStore();
  const [filtreProfilActif, setFiltreProfilActif] = useState(false);
  const decisionProfilPrise = useRef(false);
  const filtresSecondairesActifs = CLES_SECONDAIRES.some((cle) => params.get(cle));
  const [plusDeFiltres, setPlusDeFiltres] = useState(false);

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

  // Un filtre secondaire déjà actif (lien partagé, retour arrière) déplie le panneau : sinon il resterait
  // invisible, contredisant l'exigence « filtres actifs visibles ».
  useEffect(() => {
    if (filtresSecondairesActifs) setPlusDeFiltres(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filiereApi
      .filtres()
      .then(({ data }) => setValeurs(data))
      .catch(() => setValeurs({ domaines: [], series: [], departements: [] }));
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

  // Filtre par défaut sur le domaine dominant du profil de découverte : une fois par dossier et par
  // session de navigateur, et seulement si la page s'ouvre sans aucun filtre déjà choisi (sinon une
  // recherche explicite se combinerait silencieusement avec un domaine sans rapport). Inactif pour
  // un visiteur anonyme ou un rôle non concerné : statutMur reste alors 'inactif' en permanence.
  useEffect(() => {
    if (decisionProfilPrise.current || statutMur !== 'pret') return;
    decisionProfilPrise.current = true;
    const cle = `catalogue-filtre-profil:${nipMur}`;
    if (sessionStorage.getItem(cle) || window.location.search) return;
    sessionStorage.setItem(cle, '1');
    const domaine = decouverte ? domaineDominant(decouverte.affinites) : null;
    if (domaine) {
      modifier({ domaine });
      setFiltreProfilActif(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statutMur, decouverte, nipMur]);

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

  // Une puce par filtre actif, avec son propre bouton de suppression — pas seulement un « tout effacer »
  // global : l'utilisateur doit pouvoir retirer un seul critère sans perdre les autres.
  const puces: { cle: Cle; libelle: string }[] = [
    q && { cle: 'q' as const, libelle: `« ${q} »` },
    params.get('niveau') && { cle: 'niveau' as const, libelle: NIVEAU_LABELS[params.get('niveau') as NiveauAcces] },
    params.get('type') && { cle: 'type' as const, libelle: TYPE_LABELS[params.get('type') as TypeFiliere] },
    params.get('domaine') && { cle: 'domaine' as const, libelle: DOMAINE_LABELS[params.get('domaine') as Domaine] },
    params.get('departement') && { cle: 'departement' as const, libelle: params.get('departement') as string },
    serie && { cle: 'serie' as const, libelle: `Bac ${serie}` },
    params.get('bourses') === 'true' && { cle: 'bourses' as const, libelle: 'Avec bourses' },
    params.get('officielle') === 'true' && { cle: 'officielle' as const, libelle: 'Source officielle' },
  ].filter((p): p is { cle: Cle; libelle: string } => !!p);

  return (
    <div className="py-8v">
      <div className="bj-container stagger-sections">
        {/* Hero court : titre, phrase d'intention, recherche — le reste (filtres) vient juste après, sans surcharger cette 1re impression. */}
        <div className="max-w-2xl mb-6v">
          <h1 className="text-3xl font-bold mb-2v">Catalogue des filières</h1>
          <p className="text-text-secondary">Explore les formations accessibles après le BEPC et après le baccalauréat au Bénin.</p>
        </div>

        <div className="relative max-w-2xl mb-6v">
          <Search className="absolute left-3v top-1/2 -translate-y-1/2 text-text-secondary" size={20} aria-hidden="true" />
          <label htmlFor="recherche" className="sr-only">
            Rechercher une filière
          </label>
          <input
            id="recherche"
            type="search"
            placeholder="Une formation, un métier, une ville…"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            className={`${CHAMP} pl-10 py-3v text-base`}
          />
        </div>

        <div className="flex gap-3v items-start p-4v mb-8v rounded-bj-sm border border-info/30 bg-info/5 text-sm">
          <Info className="text-info shrink-0 mt-[2px]" size={18} aria-hidden="true" />
          <p>Catalogue constitué à partir de sources publiques, en attente de validation par le Ministère. Chaque fiche indique ses sources.</p>
        </div>

        {/* Filtres primaires : les 2 critères les plus utilisés, toujours visibles avec un libellé clair. */}
        <div className="mb-4v">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3v">
            <div>
              <label htmlFor="filtre-niveau" className="block text-xs font-medium text-text-secondary mb-1v">
                Niveau d&apos;accès
              </label>
              <select
                id="filtre-niveau"
                value={params.get('niveau') ?? ''}
                onChange={(e) => modifier({ niveau: e.target.value, ...(e.target.value !== 'APRES_BAC' ? { serie: '' } : {}) })}
                className={CHAMP}
              >
                <option value="">Tous les niveaux</option>
                {(Object.keys(NIVEAU_LABELS) as NiveauAcces[]).map((n) => (
                  <option key={n} value={n}>
                    {NIVEAU_LABELS[n]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filtre-domaine" className="block text-xs font-medium text-text-secondary mb-1v">
                Domaine
              </label>
              <select id="filtre-domaine" value={params.get('domaine') ?? ''} onChange={(e) => modifier({ domaine: e.target.value })} className={CHAMP}>
                <option value="">Tous les domaines</option>
                {valeurs?.domaines.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.libelle} ({d.total})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPlusDeFiltres(!plusDeFiltres)}
            aria-expanded={plusDeFiltres}
            aria-controls="filtres-secondaires"
            className="inline-flex items-center gap-2v mt-3v text-sm font-medium text-primary hover:underline"
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            {plusDeFiltres ? 'Moins de filtres' : 'Plus de filtres'}
            {!plusDeFiltres && filtresSecondairesActifs && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-text-on-primary text-[10px] font-bold">
                {CLES_SECONDAIRES.filter((cle) => params.get(cle)).length}
              </span>
            )}
          </button>

          {plusDeFiltres && (
            <div id="filtres-secondaires" className="mt-3v p-4v rounded-bj-sm border border-border bg-background space-y-3v">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3v">
                <div>
                  <label htmlFor="filtre-type" className="block text-xs font-medium text-text-secondary mb-1v">
                    Type de formation
                  </label>
                  <select id="filtre-type" value={params.get('type') ?? ''} onChange={(e) => modifier({ type: e.target.value })} className={CHAMP}>
                    <option value="">Tous les types</option>
                    {(Object.keys(TYPE_LABELS) as TypeFiliere[]).map((t) => (
                      <option key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="filtre-departement" className="block text-xs font-medium text-text-secondary mb-1v">
                    Département
                  </label>
                  <select
                    id="filtre-departement"
                    value={params.get('departement') ?? ''}
                    onChange={(e) => modifier({ departement: e.target.value })}
                    className={CHAMP}
                  >
                    <option value="">Tous les départements</option>
                    {valeurs?.departements.map((d) => (
                      <option key={d.nom} value={d.nom}>
                        {d.nom} ({d.total})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="filtre-serie" className="block text-xs font-medium text-text-secondary mb-1v">
                    Série de bac
                  </label>
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
              <div className="flex flex-wrap items-center gap-x-6v gap-y-2v pt-1v">
                <label className="inline-flex items-center gap-2v text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.get('bourses') === 'true'}
                    onChange={(e) => modifier({ bourses: e.target.checked ? 'true' : '' })}
                    className="w-4 h-4 accent-primary"
                  />
                  Avec bourses
                </label>
                <label className="inline-flex items-center gap-2v text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.get('officielle') === 'true'}
                    onChange={(e) => modifier({ officielle: e.target.checked ? 'true' : '' })}
                    className="w-4 h-4 accent-primary"
                  />
                  Source officielle uniquement
                </label>
              </div>
            </div>
          )}

          {raccourci && (
            <button
              type="button"
              onClick={() => modifier({ serie: raccourci.serie, niveau: 'APRES_BAC' })}
              className="inline-flex items-center gap-2v mt-3v px-3v py-2v rounded-full border border-primary text-sm font-medium text-primary hover:bg-primary/5"
            >
              <GraduationCap size={16} aria-hidden="true" /> Que faire avec mon bac {raccourci.serie} ?
            </button>
          )}
        </div>

        {/* Puces de filtres actifs : chacune supprimable individuellement (pas qu'un « tout effacer »). */}
        {puces.length > 0 && (
          <div className="flex flex-wrap items-center gap-2v mb-6v" aria-label="Filtres actifs">
            <span className="inline-flex items-center gap-1v text-xs text-text-muted">
              <Filter size={13} aria-hidden="true" /> Filtré par :
            </span>
            {puces.map((p) => (
              <button
                key={p.cle}
                type="button"
                onClick={() => modifier({ [p.cle]: '' })}
                className="inline-flex items-center gap-1v pl-3v pr-2v py-1v rounded-full bg-primary-soft text-primary text-xs font-medium hover:bg-primary/20"
              >
                {p.libelle}
                <X size={13} aria-hidden="true" />
                <span className="sr-only">Retirer ce filtre</span>
              </button>
            ))}
            <button type="button" onClick={effacer} className="text-xs font-medium text-text-secondary hover:text-primary hover:underline ml-1v">
              Tout effacer
            </button>
          </div>
        )}

        {filtreProfilActif && params.get('domaine') && (
          <div role="note" className="flex flex-wrap gap-3v items-center justify-between p-4v mb-6v rounded-bj-sm border border-primary/30 bg-primary/5 text-sm">
            <p className="flex items-center gap-2v">
              <Compass size={16} className="text-primary shrink-0" aria-hidden="true" />
              Filtré sur <strong>{DOMAINE_LABELS[params.get('domaine') as Domaine]}</strong>, d&apos;après le questionnaire de découverte.
            </p>
            <button
              type="button"
              onClick={() => {
                modifier({ domaine: '' });
                setFiltreProfilActif(false);
              }}
              className="font-medium text-primary hover:underline shrink-0"
            >
              Tout afficher
            </button>
          </div>
        )}

        {serieChoisie && (
          <div role="note" className="flex gap-3v items-start p-4v mb-6v rounded-bj-sm border border-primary/30 bg-primary/5 text-sm">
            <GraduationCap className="text-primary shrink-0 mt-[2px]" size={18} aria-hidden="true" />
            <p>
              Formations du supérieur accessibles avec un <strong>bac {serieChoisie.serie}</strong> ({serieChoisie.libelle}). Seules les
              formations dont les séries admises sont connues apparaissent : vérifie toujours les conditions sur la fiche.
            </p>
          </div>
        )}

        {erreurFavoris && <Alerte ton="erreur">{erreurFavoris}</Alerte>}

        {statut === 'erreur' && (
          <div role="alert" className="text-center py-12v">
            <p className="text-text-secondary text-lg mb-4v">Impossible de charger le catalogue pour le moment.</p>
            <div className="flex flex-wrap justify-center gap-3v">
              <Button variant="secondary" onClick={() => setTentative((n) => n + 1)}>
                Réessayer
              </Button>
              {filtresActifs && (
                <Button variant="secondary" onClick={effacer}>
                  Effacer les filtres
                </Button>
              )}
            </div>
          </div>
        )}

        {statut === 'chargement' && <SkeletonGrid />}

        {statut === 'ok' && (
          <>
            <p className="text-sm text-text-secondary mb-6v" aria-live="polite">
              {total} filière{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}
              {total > filieres.length && ` — ${filieres.length} affichées`}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6v">
              {filieres.map((filiere) => (
                <CarteFiliere key={filiere.id} filiere={filiere} />
              ))}
            </div>

            {filieres.length < total && (
              <div className="mt-8v text-center">
                <Button variant="secondary" onClick={afficherPlus} loading={suite === 'chargement'}>
                  {suite === 'chargement' ? 'Chargement…' : `Afficher plus de formations (${total - filieres.length} restantes)`}
                </Button>
                {suite === 'erreur' && (
                  <p role="alert" className="mt-3v text-sm text-danger">
                    Impossible de charger la suite pour le moment. Réessaie.
                  </p>
                )}
              </div>
            )}

            {filieres.length === 0 && (
              <EmptyState
                className="my-4v"
                icon={<Search size={22} aria-hidden="true" />}
                title="Aucune filière trouvée pour cette recherche"
                description={
                  filtresActifs
                    ? 'Essaie d’élargir tes critères, ou repars sans filtre pour explorer librement le catalogue.'
                    : 'Le catalogue est momentanément vide pour cette combinaison.'
                }
                action={
                  <div className="flex flex-wrap justify-center gap-3v">
                    {filtresActifs && (
                      <Button variant="secondary" onClick={effacer}>
                        Effacer les filtres
                      </Button>
                    )}
                    <Link href="/espace-apprenant/decouverte" className="text-sm font-medium text-primary hover:underline self-center">
                      Ou découvrir tes pistes avec le questionnaire →
                    </Link>
                  </div>
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
