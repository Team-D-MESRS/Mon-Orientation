'use client';

import { Fragment, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ShieldCheck, SplitSquareHorizontal, X } from 'lucide-react';
import { filiereApi } from '@/lib/api';
import { DOMAINE_LABELS, MAX_COMPARAISON, NIVEAU_LABELS, TYPE_LABELS, TYPE_TONES, aUneSourceOfficielle, type Filiere, resumeLieux } from '@/lib/filiere';
import { restaurerComparateur, useComparateur } from '@/stores/comparateurStore';
import { BoutonFavori } from '@/components/catalogue/BoutonFavori';
import { Partage } from '@/components/catalogue/Partage';
import { Alerte, Chargement } from '@/components/espace/ui';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { IconButton } from '@/components/ui/IconButton';

const ID_FILIERE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIEN = 'font-medium text-primary hover:underline';

const nonRenseigne = (texte = 'Non renseigné') => <span className="text-text-secondary italic">{texte}</span>;
const liste = (valeurs: string[] | null) =>
  valeurs && valeurs.length > 0 ? (
    <ul className="list-disc pl-4v space-y-1v">
      {valeurs.map((v) => (
        <li key={v}>{v}</li>
      ))}
    </ul>
  ) : (
    nonRenseigne()
  );

interface Ligne {
  titre: string;
  valeur: (f: Filiere) => ReactNode;
  /**
   * Valeur simple comparable, pour signaler quand les formations diffèrent sur ce critère précis.
   * Absente volontairement sur les critères en texte libre (métiers visés, débouchés…) : ils diffèrent
   * presque toujours d'une formation à l'autre, le signaler n'apporterait aucune information utile — la
   * différence n'est « importante » à signaler que sur les critères qui pèsent vraiment dans un choix.
   */
  comparer?: (f: Filiere) => string;
}

interface Groupe {
  titre: string;
  lignes: Ligne[];
}

const GROUPES: Groupe[] = [
  {
    titre: 'Accès et admission',
    lignes: [
      { titre: "Niveau d'accès", valeur: (f) => (f.niveauAcces ? NIVEAU_LABELS[f.niveauAcces] : nonRenseigne()), comparer: (f) => f.niveauAcces ?? '' },
      { titre: "Conditions d'accès", valeur: (f) => f.conditionsAcces ?? nonRenseigne() },
      { titre: 'Mode d’entrée', valeur: (f) => f.modeEntree ?? nonRenseigne() },
      {
        titre: 'Séries de bac admises',
        valeur: (f) =>
          f.seriesRecommandees ??
          (f.seriesAdmises?.length ? f.seriesAdmises.join(', ') : nonRenseigne(f.niveauAcces === 'APRES_BEPC' ? 'Sans objet (après le BEPC)' : undefined)),
      },
      { titre: 'Matières du classement', valeur: (f) => f.matieresClassement ?? nonRenseigne() },
    ],
  },
  {
    titre: 'Formation',
    lignes: [
      { titre: 'Diplômes délivrés', valeur: (f) => liste(f.diplomesDelivres) },
      { titre: 'Où se former', valeur: (f) => (f.offres?.length ? resumeLieux(f.offres) : (f.ouSeFormer ?? nonRenseigne())) },
    ],
  },
  {
    titre: 'Débouchés',
    lignes: [
      { titre: 'Métiers visés', valeur: (f) => liste(f.metiersVises) },
      { titre: 'Débouchés', valeur: (f) => f.debouches ?? nonRenseigne() },
      {
        titre: "Taux d'insertion",
        valeur: (f) => (f.tauxInsertion === null ? nonRenseigne('Aucune donnée publique') : `${f.tauxInsertion} %`),
        comparer: (f) => String(f.tauxInsertion ?? ''),
      },
    ],
  },
  {
    titre: 'Coût et bourses',
    lignes: [
      { titre: 'Places avec bourse', valeur: (f) => f.quotaBourses ?? nonRenseigne() },
      { titre: 'Aides ou places partiellement payantes', valeur: (f) => f.quotaAides ?? nonRenseigne() },
      {
        titre: 'Bourses',
        valeur: (f) => (f.bourses === null ? nonRenseigne() : f.bourses ? 'Oui, sur classement' : 'Non'),
        comparer: (f) => String(f.bourses),
      },
    ],
  },
  {
    titre: 'Confiance dans la source',
    lignes: [
      {
        titre: 'Sources',
        valeur: (f) =>
          aUneSourceOfficielle(f) ? (
            <span className="inline-flex items-center gap-1v text-primary">
              <ShieldCheck size={14} aria-hidden="true" /> Source officielle
            </span>
          ) : (
            <span className="inline-flex items-center gap-1v text-warning-strong">
              <AlertTriangle size={14} aria-hidden="true" /> À confirmer
            </span>
          ),
        comparer: (f) => String(aUneSourceOfficielle(f)),
      },
    ],
  },
];

/** Vrai si au moins deux formations comparées ont une valeur différente sur ce critère. */
function difference(ligne: Ligne, fiches: Filiere[]): boolean {
  if (!ligne.comparer || fiches.length < 2) return false;
  const valeurs = new Set(fiches.map(ligne.comparer));
  return valeurs.size > 1;
}

export default function ComparerPage() {
  return (
    <Suspense fallback={<Chargement />}>
      <Comparateur />
    </Suspense>
  );
}

function Comparateur() {
  const router = useRouter();
  const params = useSearchParams();
  const brut = params.get('ids') ?? '';
  const ids = useMemo(() => Array.from(new Set(brut.split(',').filter((id) => ID_FILIERE.test(id)))).slice(0, MAX_COMPARAISON), [brut]);
  const [fiches, setFiches] = useState<Filiere[] | null>(null);
  const [introuvables, setIntrouvables] = useState(0);
  const [erreur, setErreur] = useState(false);

  // Sans identifiants dans l'adresse : reprendre la sélection faite dans le catalogue
  useEffect(() => {
    if (ids.length > 0) return;
    restaurerComparateur().then(() => {
      const selection = useComparateur.getState().selection;
      if (selection.length > 0) router.replace(`/catalogue/comparer?ids=${selection.map((f) => f.id).join(',')}`);
      else setFiches([]);
    });
  }, [ids, router]);

  useEffect(() => {
    if (ids.length === 0) return;
    let annule = false;
    setFiches(null);
    setErreur(false);
    Promise.allSettled(ids.map((id) => filiereApi.get(id))).then(async (resultats) => {
      if (annule) return;
      const trouvees = resultats.flatMap((r) => (r.status === 'fulfilled' ? [r.value.data] : []));
      const autreEchec = resultats.some((r) => r.status === 'rejected' && r.reason?.response?.status !== 404);
      if (autreEchec) {
        setErreur(true);
        return;
      }
      setIntrouvables(ids.length - trouvees.length);
      setFiches(trouvees);
      // La sélection du catalogue suit la comparaison affichée (lien reçu, fiche disparue)
      await restaurerComparateur();
      useComparateur.getState().remplacer(trouvees.map((f) => ({ id: f.id, nom: f.nom })));
    });
    return () => {
      annule = true;
    };
  }, [ids]);

  const retirer = (id: string) => {
    const restantes = (fiches ?? []).filter((f) => f.id !== id);
    useComparateur.getState().retirer(id);
    router.replace(restantes.length > 0 ? `/catalogue/comparer?ids=${restantes.map((f) => f.id).join(',')}` : '/catalogue/comparer', {
      scroll: false,
    });
  };

  return (
    <div className="py-8v">
      <div className="bj-container stagger-sections">
        <Breadcrumb className="mb-6v" items={[{ label: 'Catalogue', href: '/catalogue' }, { label: 'Comparer' }]} />
        <h1 className="text-3xl font-bold mb-2v">Comparer des formations</h1>
        <p className="text-text-secondary mb-6v">
          Jusqu&apos;à {MAX_COMPARAISON} formations côte à côte, regroupées par thème. Les informations proviennent des fiches du catalogue et
          de leurs sources.
        </p>

        {erreur && <Alerte ton="erreur">Impossible de charger la comparaison pour le moment. Réessaie dans quelques instants.</Alerte>}
        {!erreur && fiches === null && <Chargement />}
        {fiches && introuvables > 0 && (
          <Alerte ton="attention">
            {introuvables === 1 ? "Une formation de ce lien n'existe plus" : `${introuvables} formations de ce lien n'existent plus`} dans le catalogue.
          </Alerte>
        )}

        {fiches && fiches.length === 0 && (
          <Alerte ton="info">
            Aucune formation à comparer. Dans le{' '}
            <Link href="/catalogue" className={LIEN}>
              catalogue
            </Link>
            , appuie sur « Comparer » sur 2 ou 3 formations.
          </Alerte>
        )}

        {fiches && fiches.length > 0 && (
          <>
            {fiches.length === 1 && (
              <Alerte ton="info">
                Ajoute au moins une autre formation depuis le{' '}
                <Link href="/catalogue" className={LIEN}>
                  catalogue
                </Link>{' '}
                pour la comparer.
              </Alerte>
            )}
            <div className="mb-4v">
              <Partage titre={`Comparaison : ${fiches.map((f) => f.nom).join(' / ')}`} />
            </div>

            {/* relative : les textes réservés aux lecteurs d'écran (sr-only, en position absolue) défilent avec le
                tableau au lieu d'élargir la page sur mobile. Les noms de formations restent de vrais en-têtes
                de colonne (scope="col") : indispensable pour qu'un lecteur d'écran annonce à quelle formation
                appartient chaque valeur, même si l'essentiel de la comparaison se fait à l'œil. */}
            <div className="relative overflow-x-auto rounded-bj-md border border-border bg-surface">
              <table className="w-full min-w-[36rem] text-sm">
                <caption className="sr-only">Comparaison de {fiches.length} formation(s), regroupée par thème</caption>
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="sticky left-0 z-[1] bg-background p-4v w-40 min-w-[9rem]">
                      <span className="sr-only">Critère</span>
                    </th>
                    {fiches.map((f) => (
                      <th key={f.id} scope="col" className="p-4v text-left align-top font-normal min-w-[12rem]">
                        <div className="flex items-start justify-between gap-2v mb-2v">
                          <Badge ton={TYPE_TONES[f.type]}>{TYPE_LABELS[f.type]}</Badge>
                          <IconButton
                            icon={<X size={15} aria-hidden="true" />}
                            label={`Retirer ${f.nom} de la comparaison`}
                            variant="ghost"
                            size="sm"
                            onClick={() => retirer(f.id)}
                            className="print:hidden shrink-0 -mr-2v -mt-1v"
                          />
                        </div>
                        <Link href={`/catalogue/${f.id}`} className="block font-bold leading-snug hover:text-primary">
                          {f.nom}
                        </Link>
                        {f.domaines.length > 0 && (
                          <p className="text-xs text-text-secondary mt-1v font-normal">{f.domaines.map((d) => DOMAINE_LABELS[d]).join(' · ')}</p>
                        )}
                        <div className="mt-2v print:hidden">
                          <BoutonFavori filiere={f} compact />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GROUPES.map((groupe) => (
                    <Fragment key={groupe.titre}>
                      <tr className="bg-background">
                        <th
                          colSpan={fiches.length + 1}
                          scope="colgroup"
                          className="sticky left-0 text-left px-4v py-2v text-xs font-bold uppercase tracking-wide text-primary border-y border-border"
                        >
                          {groupe.titre}
                        </th>
                      </tr>
                      {groupe.lignes.map((ligne) => {
                        const diff = difference(ligne, fiches);
                        return (
                          <tr key={ligne.titre} className="border-b border-border last:border-b-0">
                            <th scope="row" className="sticky left-0 z-[1] bg-surface p-4v w-40 min-w-[9rem] text-left align-top font-medium text-text-secondary">
                              <span className="flex items-start gap-1v">
                                {ligne.titre}
                                {diff && (
                                  <span
                                    className="inline-flex items-center gap-1v shrink-0 mt-[2px] px-2v py-[1px] rounded-full bg-accent-soft text-accent-strong text-[10px] font-bold uppercase tracking-wide"
                                    title="Ce critère diffère selon la formation"
                                  >
                                    <SplitSquareHorizontal size={10} aria-hidden="true" /> Diffère
                                  </span>
                                )}
                              </span>
                            </th>
                            {fiches.map((f) => (
                              <td key={f.id} className={`p-4v align-top ${diff ? 'bg-accent-soft/40' : ''}`}>
                                {ligne.valeur(f)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4v rounded-bj-sm border-l-4 border-primary bg-primary/5 p-4v text-sm">
              <p className="font-semibold text-primary mb-1v">Comment choisir ?</p>
              <p className="text-text-secondary">
                Commence par vérifier l’accès, le lieu de formation et les métiers visés. Les conditions officielles et les sources priment
                toujours sur le taux d’insertion. Les critères marqués « Diffère » méritent une attention particulière ; ceux marqués « Non
                renseigné » restent à vérifier auprès de l’établissement — ce comparateur aide à y voir clair, il ne décide pas à ta place.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
