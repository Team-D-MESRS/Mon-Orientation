'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { orientationApi } from '@/lib/api';
import { ORDINAUX, type Recommandation } from '@/lib/apprenant';
import { messageErreur } from '@/lib/erreurs';
import { useProfil } from '@/components/espace/EspaceContext';
import { Alerte, BadgeType, Chargement } from '@/components/espace/ui';

export default function RecommandationsPage() {
  const profil = useProfil();
  const [recommandations, setRecommandations] = useState<Recommandation[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [calcul, setCalcul] = useState(false);

  const calculer = useCallback(async () => {
    setCalcul(true);
    setErreur(null);
    try {
      const { data } = await orientationApi.calculer(profil.nip);
      setRecommandations(data);
    } catch (err) {
      setErreur(messageErreur(err));
      setRecommandations((actuelles) => actuelles ?? []);
    } finally {
      setCalcul(false);
    }
  }, [profil.nip]);

  useEffect(() => {
    let annule = false;
    setRecommandations(null);
    orientationApi
      .getRecommandations(profil.nip)
      .then(({ data }) => {
        if (annule) return;
        // Première visite : on calcule directement plutôt que d'afficher une page vide
        if (data.length === 0) calculer();
        else setRecommandations(data);
      })
      .catch((err) => {
        if (annule) return;
        setErreur(messageErreur(err));
        setRecommandations([]);
      });
    return () => {
      annule = true;
    };
  }, [profil.nip, calculer]);

  const exploration = profil.palier === 'QUATRIEME';

  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4v">
        <div>
          <h2 className="text-xl font-bold">{exploration ? 'Pistes à explorer' : "Recommandations d'orientation"}</h2>
          <p className="text-sm text-bj-gray-500">
            {exploration
              ? 'À partir des résultats de 4e, quelques formations à découvrir.'
              : "À partir des notes, des vœux et des conditions d'accès connues."}
          </p>
        </div>
        <button type="button" onClick={calculer} disabled={calcul} className="bj-btn bj-btn-secondary inline-flex items-center gap-2v self-start">
          <RefreshCw size={16} className={calcul ? 'animate-spin' : ''} aria-hidden="true" />
          {calcul ? 'Calcul…' : 'Mettre à jour'}
        </button>
      </div>

      <Alerte ton="info">
        Ces propositions aident à réfléchir, elles ne décident pas à ta place : parles-en avec ta famille et ton conseiller d&apos;orientation.
        Les critères de calcul sont une première version, à valider par les conseillers d&apos;orientation.
      </Alerte>
      {erreur && <Alerte ton="erreur">{erreur}</Alerte>}

      {recommandations === null ? (
        <Chargement texte="Calcul des recommandations…" />
      ) : recommandations.length === 0 ? (
        <p className="text-bj-gray-500">Aucune recommandation pour l&apos;instant.</p>
      ) : (
        <ol className="space-y-4v mt-6v">
          {recommandations.map((r, i) => (
            <CarteRecommandation key={r.id} recommandation={r} rang={i + 1} />
          ))}
        </ol>
      )}
    </section>
  );
}

function CarteRecommandation({ recommandation: r, rang }: { recommandation: Recommandation; rang: number }) {
  const criteres = r.criteres ?? [];
  const voeu = criteres.find((c) => c.critere === 'preference');
  const nonAccessible = r.score === 0 && criteres.some((c) => c.critere === 'serie' && c.alerte);
  const score = Math.round(r.score);

  return (
    <li className="bg-white rounded-bj-md border border-bj-gray-925 p-6v">
      <div className="flex flex-col md:flex-row md:items-start gap-4v">
        <span className="w-10 h-10 rounded-full bg-bj-green/10 text-bj-green font-bold flex items-center justify-center shrink-0" aria-hidden="true">
          {rang}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2v mb-2v">
            <BadgeType type={r.filiere.type} />
            {voeu?.rang && (
              <span className="px-3v py-1v rounded-full text-xs font-medium bg-bj-green text-white">Ton {ORDINAUX[voeu.rang - 1]} choix</span>
            )}
          </div>
          <h3 className="text-lg font-bold">
            <Link href={`/catalogue/${r.filiere.id}`} className="hover:text-bj-green hover:underline">
              {r.filiere.nom}
            </Link>
          </h3>
          <ul className="mt-3v space-y-1v text-sm">
            {criteres.map((c, i) => (
              <li key={i} className={`flex gap-2v ${c.alerte ? 'text-bj-ochre-fonce' : ''}`}>
                {c.alerte ? (
                  <AlertTriangle size={16} className="shrink-0 mt-[2px]" aria-hidden="true" />
                ) : (
                  <CheckCircle2 size={16} className="shrink-0 mt-[2px] text-bj-green" aria-hidden="true" />
                )}
                <span>
                  {c.detail}
                  {c.points !== 0 && (
                    <span className="text-xs text-bj-gray-500">
                      {' '}
                      ({c.points > 0 ? '+' : ''}
                      {c.points} pts)
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:w-40 shrink-0">
          {nonAccessible ? (
            <p className="text-sm font-medium text-bj-ochre-fonce">Non accessible avec ta série</p>
          ) : (
            <>
              <p className="text-sm text-bj-gray-500">Compatibilité</p>
              <p className="text-2xl font-bold text-bj-green">
                {score}
                <span className="text-sm font-medium text-bj-gray-500">/100</span>
              </p>
              <div
                className="h-2 rounded-full bg-bj-gray-925 overflow-hidden mt-1v"
                role="meter"
                aria-label="Score de compatibilité"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={score}
              >
                <div className="h-full bg-bj-green" style={{ width: `${score}%` }} />
              </div>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
