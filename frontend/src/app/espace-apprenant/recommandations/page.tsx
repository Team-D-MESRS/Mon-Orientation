'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { orientationApi } from '@/lib/api';
import { DOMAINE_LABELS } from '@/lib/filiere';
import { ORDINAUX, type Recommandation } from '@/lib/apprenant';
import { messageErreur } from '@/lib/erreurs';
import { useEspace, useProfil } from '@/components/espace/EspaceContext';
import { Alerte, BadgeType, Chargement } from '@/components/espace/ui';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function RecommandationsPage() {
  const profil = useProfil();
  const { estParent } = useEspace();
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
      <SectionHeader
        title={exploration ? 'Pistes à explorer' : "Recommandations d'orientation"}
        subtitle={
          exploration
            ? 'À partir des résultats de 4e, quelques formations à découvrir.'
            : "À partir des notes, des vœux et des conditions d'accès connues."
        }
        action={
          <Button variant="secondary" size="sm" loading={calcul} icon={<RefreshCw size={16} aria-hidden="true" />} onClick={calculer}>
            Mettre à jour
          </Button>
        }
      />

      <Alerte ton="info">
        {estParent ? (
          <>
            Ces propositions aident à réfléchir, elles ne décident pas à la place de {profil.prenom} : parlez-en en famille et avec son conseiller
            d&apos;orientation.
          </>
        ) : (
          <>
            Ces propositions aident à réfléchir, elles ne décident pas à ta place : parles-en avec ta famille et ton conseiller d&apos;orientation.
          </>
        )}{' '}
        Les critères de calcul sont une première version, à valider par les conseillers d&apos;orientation.
      </Alerte>
      {erreur && <Alerte ton="erreur">{erreur}</Alerte>}

      {recommandations === null ? (
        <Chargement texte="Calcul des recommandations…" />
      ) : recommandations.length === 0 ? (
        <EmptyState
          title="Aucune recommandation pour l’instant"
          description={
            estParent
              ? `Elles apparaîtront une fois le profil de découverte ou les vœux de ${profil.prenom} complétés.`
              : 'Reviens après avoir complété ton profil de découverte ou tes vœux.'
          }
        />
      ) : (
        <div className="space-y-8v mt-6v">
          {Array.from(
            recommandations.reduce((groupes, recommandation) => {
              const domaine = recommandation.filiere.domaines[0] ?? 'AUTRES';
              const groupe = groupes.get(domaine) ?? [];
              groupes.set(domaine, [...groupe, recommandation]);
              return groupes;
            }, new Map<string, Recommandation[]>()).entries(),
          ).map(([domaine, groupe]) => (
            <section key={domaine} aria-labelledby={`famille-${domaine}`}>
              <div className="flex items-end justify-between gap-3v mb-3v">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Famille de métiers</p>
                  <h3 id={`famille-${domaine}`} className="text-lg font-bold">{DOMAINE_LABELS[domaine as keyof typeof DOMAINE_LABELS] ?? 'Autres pistes techniques'}</h3>
                </div>
                <span className="text-xs text-text-secondary">{groupe.length} piste{groupe.length > 1 ? 's' : ''}</span>
              </div>
              <ol className="space-y-4v">
                {groupe.map((r) => (
                  <CarteRecommandation key={r.id} recommandation={r} rang={recommandations.indexOf(r) + 1} estParent={estParent} />
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function CarteRecommandation({
  recommandation: r,
  rang,
  estParent,
}: {
  recommandation: Recommandation;
  rang: number;
  estParent: boolean;
}) {
  const criteres = r.criteres ?? [];
  const voeu = criteres.find((c) => c.critere === 'preference');
  const nonAccessible = r.score === 0 && criteres.some((c) => c.critere === 'serie' && c.alerte);
  const score = Math.round(r.score);

  return (
    <li className="bg-surface rounded-bj-md border border-border p-6v">
      <div className="flex flex-col md:flex-row md:items-start gap-4v">
        <span className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0" aria-hidden="true">
          {rang}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2v mb-2v">
            <BadgeType type={r.filiere.type} />
            {voeu?.rang && (
              <Badge ton="marque" variant="solid">
                {estParent ? `${ORDINAUX[voeu.rang - 1]} choix` : `Ton ${ORDINAUX[voeu.rang - 1]} choix`}
              </Badge>
            )}
          </div>
          <h3 className="text-lg font-bold">
            <Link href={`/catalogue/${r.filiere.id}`} className="hover:text-primary hover:underline">
              {r.filiere.nom}
            </Link>
          </h3>
          <div className="mt-3v rounded-bj-sm border-l-4 border-primary bg-primary/5 px-3v py-2v text-sm">
            <p className="font-semibold text-primary mb-1v">Pourquoi cette piste ?</p>
            <p className="text-text-secondary">
              {r.explication ||
                (estParent
                  ? 'Cette formation a été rapprochée des intérêts, du parcours scolaire et des préférences enregistrées.'
                  : 'Cette formation a été rapprochée de tes intérêts, de ton parcours scolaire et de tes préférences.')}
            </p>
          </div>
          <ul className="mt-3v space-y-1v text-sm">
            {criteres.map((c, i) => (
              <li key={i} className={`flex gap-2v ${c.alerte ? 'text-warning-strong' : ''}`}>
                {c.alerte ? (
                  <AlertTriangle size={16} className="shrink-0 mt-[2px]" aria-hidden="true" />
                ) : (
                  <CheckCircle2 size={16} className="shrink-0 mt-[2px] text-primary" aria-hidden="true" />
                )}
                <span>
                  {c.detail}
                  {c.points !== 0 && (
                    <span className="text-xs text-text-secondary">
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
            <p className="text-sm font-medium text-warning-strong">{estParent ? 'Non accessible avec cette série' : 'Non accessible avec ta série'}</p>
          ) : (
            <>
              <p className="text-sm text-text-secondary">Compatibilité</p>
              <p className="text-2xl font-bold text-primary">
                {score}
                <span className="text-sm font-medium text-text-secondary">/100</span>
              </p>
              <ProgressBar className="mt-1v" value={score} label="Score de compatibilité" size="sm" />
            </>
          )}
        </div>
      </div>
    </li>
  );
}
