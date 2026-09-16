'use client';

import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ShieldCheck, X } from 'lucide-react';
import { filiereApi } from '@/lib/api';
import { DOMAINE_LABELS, MAX_COMPARAISON, NIVEAU_LABELS, aUneSourceOfficielle, type Filiere } from '@/lib/filiere';
import { restaurerComparateur, useComparateur } from '@/stores/comparateurStore';
import { BoutonFavori } from '@/components/catalogue/BoutonFavori';
import { Partage } from '@/components/catalogue/Partage';
import { Alerte, BadgeType, Chargement } from '@/components/espace/ui';

const ID_FILIERE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIEN = 'font-medium text-bj-green hover:underline';

const nonRenseigne = (texte = 'Non renseigné') => <span className="text-bj-gray-500">{texte}</span>;
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

const LIGNES: { titre: string; valeur: (f: Filiere) => ReactNode }[] = [
  { titre: "Niveau d'accès", valeur: (f) => (f.niveauAcces ? NIVEAU_LABELS[f.niveauAcces] : nonRenseigne()) },
  { titre: 'Domaines', valeur: (f) => (f.domaines.length > 0 ? f.domaines.map((d) => DOMAINE_LABELS[d]).join(', ') : nonRenseigne()) },
  { titre: 'Diplômes délivrés', valeur: (f) => liste(f.diplomesDelivres) },
  { titre: "Conditions d'accès", valeur: (f) => f.conditionsAcces ?? nonRenseigne() },
  { titre: 'Mode d’entrée', valeur: (f) => f.modeEntree ?? nonRenseigne() },
  {
    titre: 'Séries de bac admises',
    valeur: (f) =>
      f.seriesRecommandees ??
      (f.seriesAdmises?.length ? f.seriesAdmises.join(', ') : nonRenseigne(f.niveauAcces === 'APRES_BEPC' ? 'Sans objet (après le BEPC)' : undefined)),
  },
  { titre: 'Matières du classement', valeur: (f) => f.matieresClassement ?? nonRenseigne() },
  { titre: 'Places avec bourse', valeur: (f) => f.quotaBourses ?? nonRenseigne() },
  { titre: 'Aides ou places partiellement payantes', valeur: (f) => f.quotaAides ?? nonRenseigne() },
  { titre: 'Où se former', valeur: (f) => f.ouSeFormer ?? nonRenseigne() },
  { titre: 'Métiers visés', valeur: (f) => liste(f.metiersVises) },
  { titre: 'Débouchés', valeur: (f) => f.debouches ?? nonRenseigne() },
  { titre: "Taux d'insertion", valeur: (f) => (f.tauxInsertion === null ? nonRenseigne('Aucune donnée publique') : `${f.tauxInsertion} %`) },
  { titre: 'Bourses', valeur: (f) => (f.bourses === null ? nonRenseigne() : f.bourses ? 'Oui, sur classement' : 'Non') },
  {
    titre: 'Sources',
    valeur: (f) =>
      aUneSourceOfficielle(f) ? (
        <span className="inline-flex items-center gap-1v text-bj-green">
          <ShieldCheck size={14} aria-hidden="true" /> Source officielle
        </span>
      ) : (
        <span className="inline-flex items-center gap-1v text-bj-ochre-fonce">
          <AlertTriangle size={14} aria-hidden="true" /> À confirmer
        </span>
      ),
  },
];

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
      <div className="bj-container">
        <Link href="/catalogue" className="inline-flex items-center gap-2v text-sm font-medium text-bj-green mb-6v hover:underline print:hidden">
          <ArrowLeft size={16} aria-hidden="true" /> Retour au catalogue
        </Link>
        <h1 className="text-3xl font-bold mb-2v">Comparer des formations</h1>
        <p className="text-bj-gray-500 mb-6v">
          Jusqu&apos;à {MAX_COMPARAISON} formations côte à côte. Les informations proviennent des fiches du catalogue et de leurs sources.
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
                tableau au lieu d'élargir la page sur mobile */}
            <div className="relative overflow-x-auto rounded-bj-md border border-bj-gray-925 bg-white">
              <table className="w-full min-w-[40rem] text-sm">
                <caption className="sr-only">Comparaison de {fiches.length} formation(s)</caption>
                <thead>
                  <tr className="border-b border-bj-gray-925">
                    <th scope="col" className="sticky left-0 z-[1] bg-bj-gray-975 p-4v w-40 min-w-[8rem]">
                      <span className="sr-only">Critère</span>
                    </th>
                    {fiches.map((f) => (
                      <th key={f.id} scope="col" className="p-4v text-left align-top font-normal min-w-[12rem]">
                        <BadgeType type={f.type} />
                        <Link href={`/catalogue/${f.id}`} className="block mt-2v text-base font-bold hover:text-bj-green">
                          {f.nom}
                        </Link>
                        <div className="mt-2v flex items-center gap-1v print:hidden">
                          <BoutonFavori filiere={f} compact />
                          <button
                            type="button"
                            onClick={() => retirer(f.id)}
                            className="inline-flex items-center gap-1v p-2v text-xs text-bj-gray-500 hover:text-bj-red"
                          >
                            <X size={14} aria-hidden="true" /> Retirer<span className="sr-only"> {f.nom} de la comparaison</span>
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LIGNES.map(({ titre, valeur }) => (
                    <tr key={titre} className="border-b border-bj-gray-925 last:border-b-0">
                      <th scope="row" className="sticky left-0 z-[1] bg-bj-gray-975 p-4v text-left align-top font-medium text-bj-gray-500">
                        {titre}
                      </th>
                      {fiches.map((f) => (
                        <td key={f.id} className="p-4v align-top">
                          {valeur(f)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
