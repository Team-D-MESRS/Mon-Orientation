'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Compass, Filter, GraduationCap, Info, Search, X } from 'lucide-react';
import { authApi, filiereApi, type ParametresCatalogue } from '@/lib/api';
import { DOMAINE_LABELS, NIVEAU_LABELS, TYPE_LABELS, type Domaine, type Filiere, type NiveauAcces, type TypeFiliere, type ValeursFiltres } from '@/lib/filiere';
import { domaineDominant, niveauDuPalier, type Palier } from '@/lib/apprenant';
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
/** Type de formation : plusieurs valeurs possibles, jointes par une virgule dans l'adresse (ex. ?type=TECHNIQUE,UNIVERSITE). */
const TYPES_FORMATION = Object.keys(TYPE_LABELS) as TypeFiliere[];

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
  const [monPalier, setMonPalier] = useState<Palier | null>(null);
  const [monNip, setMonNip] = useState<string | null>(null);
  const role = useAuthStore((s) => s.user?.role);
  const { erreur: erreurFavoris } = useFavoris();
  const { statut: statutMur, decouverte, nip: nipMur } = useDecouverteStore();
  const [filtreProfilActif, setFiltreProfilActif] = useState(false);
  const decisionProfilPrise = useRef(false);
  const decisionNiveauPrise = useRef(false);
  // Capturée une seule fois, au tout premier rendu : dit si la page s'ouvre déjà filtrée (lien partagé),
  // sans dépendre de window.location.search — qui peut changer entre deux filtres par défaut (domaine,
  // niveau) avant que l'un n'ait eu le temps de voir l'écriture de l'autre (router.replace n'est pas
  // garanti synchrone).
  const paramsInitiaux = useRef(cleRequete).current;
  const typesChoisis = useMemo(() => (params.get('type') ?? '').split(',').filter(Boolean) as TypeFiliere[], [params]);
  // router.replace ne met pas forcément à jour l'adresse de façon synchrone : deux cases cochées coup
  // sur coup, avant que le 1er changement n'ait atteint le rendu (ou même window.location), perdraient
  // sinon la 1re sélection — même famille que le bug de fermeture RIASEC déjà rencontré dans ce projet.
  // Une ref mutée immédiatement au clic, jamais dépendante d'un rendu ou d'un écho d'URL, évite ça.
  const typesRef = useRef(typesChoisis);
  typesRef.current = typesChoisis;
  const basculerType = (t: TypeFiliere) => {
    const suivants = typesRef.current.includes(t) ? typesRef.current.filter((x) => x !== t) : [...typesRef.current, t];
    typesRef.current = suivants;
    modifier({ type: suivants.join(',') });
  };

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
      .catch(() => setValeurs({ domaines: [], series: [], departements: [] }));
  }, []);

  // Élève de Première ou de Terminale : raccourci vers les formations accessibles avec sa série.
  // Palier aussi retenu, pour le filtre par défaut sur le niveau d'accès juste en dessous.
  useEffect(() => {
    if (role !== 'APPRENANT') {
      setMaSerie(null);
      setMonPalier(null);
      setMonNip(null);
      return;
    }
    authApi
      .moi()
      .then(({ data }) => {
        const eleve = data.apprenant;
        setMaSerie(eleve?.serie && (eleve.palier === 'SECONDE' || eleve.palier === 'PREMIERE' || eleve.palier === 'TERMINALE') ? eleve.serie : null);
        setMonPalier(eleve?.palier ?? null);
        setMonNip(eleve?.nip ?? null);
      })
      .catch(() => {
        setMaSerie(null);
        setMonPalier(null);
        setMonNip(null);
      });
  }, [role]);

  // Filtre par défaut sur le niveau d'accès correspondant au palier de l'élève (4e/3e → après le BEPC,
  // 1re/Tle → après le bac) : une fois par dossier et par session de navigateur, seulement si la page
  // s'ouvre sans aucun filtre déjà choisi — même principe que le filtre de domaine ci-dessous, indépendant
  // de lui (l'un ou l'autre peut être retiré sans perdre l'autre).
  useEffect(() => {
    if (decisionNiveauPrise.current || role !== 'APPRENANT' || monPalier === null || !monNip) return;
    decisionNiveauPrise.current = true;
    const cle = `catalogue-filtre-niveau:${monNip}`;
    if (sessionStorage.getItem(cle) || paramsInitiaux) return;
    sessionStorage.setItem(cle, '1');
    modifier({ niveau: niveauDuPalier(monPalier) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, monPalier, monNip]);

  // Filtre par défaut sur le domaine dominant du profil de découverte : une fois par dossier et par
  // session de navigateur, et seulement si la page s'ouvre sans aucun filtre déjà choisi (sinon une
  // recherche explicite se combinerait silencieusement avec un domaine sans rapport). Inactif pour
  // un visiteur anonyme ou un rôle non concerné : statutMur reste alors 'inactif' en permanence.
  useEffect(() => {
    if (decisionProfilPrise.current || statutMur !== 'pret') return;
    decisionProfilPrise.current = true;
    const cle = `catalogue-filtre-profil:${nipMur}`;
    if (sessionStorage.getItem(cle) || paramsInitiaux) return;
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
  // global : l'utilisateur doit pouvoir retirer un seul critère sans perdre les autres. Le type de
  // formation, multi-valué, donne une puce par valeur choisie plutôt qu'une seule pour tout le filtre.
  const puces: { id: string; libelle: string; retirer: () => void }[] = [
    q && { id: 'q', libelle: `« ${q} »`, retirer: () => modifier({ q: '' }) },
    params.get('niveau') && {
      id: 'niveau',
      libelle: NIVEAU_LABELS[params.get('niveau') as NiveauAcces],
      retirer: () => modifier({ niveau: '' }),
    },
    ...typesChoisis.map((t) => ({ id: `type-${t}`, libelle: TYPE_LABELS[t], retirer: () => basculerType(t) })),
    params.get('domaine') && {
      id: 'domaine',
      libelle: DOMAINE_LABELS[params.get('domaine') as Domaine],
      retirer: () => modifier({ domaine: '' }),
    },
    params.get('departement') && {
      id: 'departement',
      libelle: params.get('departement') as string,
      retirer: () => modifier({ departement: '' }),
    },
    serie && { id: 'serie', libelle: `Bac ${serie}`, retirer: () => modifier({ serie: '' }) },
    params.get('bourses') === 'true' && { id: 'bourses', libelle: 'Avec bourses', retirer: () => modifier({ bourses: '' }) },
    params.get('officielle') === 'true' && {
      id: 'officielle',
      libelle: 'Source officielle',
      retirer: () => modifier({ officielle: '' }),
    },
  ].filter((p): p is { id: string; libelle: string; retirer: () => void } => !!p);

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

        {/* Tous les filtres visibles d'emblée, rien de replié. */}
        <div className="mb-4v">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3v">
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

          <fieldset className="mt-3v">
            <legend className="block text-xs font-medium text-text-secondary mb-1v">Type de formation</legend>
            <div className="flex flex-wrap gap-x-5v gap-y-2v">
              {TYPES_FORMATION.map((t) => (
                <label key={t} className="inline-flex items-center gap-2v text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={typesChoisis.includes(t)}
                    onChange={() => basculerType(t)}
                    className="w-4 h-4 accent-primary"
                  />
                  {TYPE_LABELS[t]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-x-6v gap-y-2v mt-3v">
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
                key={p.id}
                type="button"
                onClick={p.retirer}
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
