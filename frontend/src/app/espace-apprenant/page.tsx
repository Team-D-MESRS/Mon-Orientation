'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Clock, GraduationCap, ListChecks, TrendingUp } from 'lucide-react';
import { apprenantApi, orientationApi } from '@/lib/api';
import {
  dateLisible,
  etiquetteProfil,
  noteLisible,
  palierDeSaisie,
  type Decouverte,
  type Favori,
  type Preference,
  type ProfilApprenant,
  type Recommandation,
} from '@/lib/apprenant';
import { useEspace, useProfil } from '@/components/espace/EspaceContext';
import { BadgeType, Carte, Chargement } from '@/components/espace/ui';

const LIEN = 'text-sm font-medium text-bj-green hover:underline';

export default function TableauDeBordPage() {
  const router = useRouter();
  const profil = useProfil();
  const { estParent, estEleve } = useEspace();
  // undefined tant que les vœux ne sont pas chargés : évite d'afficher « pas encore saisi » à tort
  const [preference, setPreference] = useState<Preference | null | undefined>(undefined);
  const [recommandations, setRecommandations] = useState<Recommandation[] | null>(null);
  const [favoris, setFavoris] = useState<Favori[] | null>(null);
  const [decouverte, setDecouverte] = useState<Decouverte | null | undefined>(undefined);

  useEffect(() => {
    let annule = false;
    setDecouverte(undefined);
    apprenantApi
      .getDecouverte(profil.nip)
      .then(({ data }) => {
        if (!annule) setDecouverte(data);
      })
      .catch(() => {
        if (!annule) setDecouverte(null);
      });
    return () => {
      annule = true;
    };
  }, [profil.nip]);

  useEffect(() => {
    if (decouverte === null) router.replace('/espace-apprenant/decouverte');
  }, [decouverte, router]);

  useEffect(() => {
    let annule = false;
    setFavoris(null);
    apprenantApi
      .getFavoris(profil.nip)
      .then(({ data }) => {
        if (!annule) setFavoris(data);
      })
      .catch(() => {
        if (!annule) setFavoris([]);
      });
    return () => {
      annule = true;
    };
  }, [profil.nip]);

  useEffect(() => {
    let annule = false;
    setPreference(undefined);
    setRecommandations(null);
    Promise.all([apprenantApi.getPreferences(profil.nip), orientationApi.getRecommandations(profil.nip)])
      .then(([voeux, recos]) => {
        if (annule) return;
        setPreference(voeux.data.find((p) => p.palier === profil.palier) ?? null);
        setRecommandations(recos.data);
      })
      .catch(() => {
        if (annule) return;
        setPreference(null);
        setRecommandations([]);
      });
    return () => {
      annule = true;
    };
  }, [profil.nip, profil.palier]);

  const { bilan } = profil;

  return (
    // Identité, classe, département et NIP figurent déjà dans l'en-tête de l'espace (CadreEspace)
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6v">
      {decouverte && (
        <div className="md:col-span-2 bg-bj-green/5 border border-bj-green/30 rounded-bj-md p-4v md:p-5v">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4v">
            <div>
              <p className="text-xs font-medium text-bj-green uppercase tracking-wide mb-1v">{estParent ? `Synthèse de ${profil.prenom}` : 'Ta synthèse d’orientation'}</p>
              <p className="font-semibold">{etiquetteProfil(decouverte)}</p>
              <p className="text-sm text-bj-gray-500 mt-1v">
                {decouverte.reponses.metierEnvisage ? `Métier envisagé : ${decouverte.reponses.metierEnvisage}.` : 'Aucun métier précis n’est encore défini, ce qui est normal à cette étape.'}
                {' '}{decouverte.reponses.internat === 'OUI' ? 'L’internat est envisageable.' : decouverte.reponses.internat === 'NON' ? 'Une formation proche du domicile est à privilégier.' : ''}
              </p>
            </div>
            <Link href="/espace-apprenant/decouverte" className={`${LIEN} shrink-0`}>Voir ou modifier le profil →</Link>
          </div>
        </div>
      )}

      <VueEnsemble profil={profil} decouverte={decouverte} recommandations={recommandations} favoris={favoris} preference={preference} estParent={estParent} />

      <Carte titre={`Résultats ${bilan.anneeScolaire ?? ''}`} icone={<TrendingUp size={18} />}>
        {bilan.moyenneGenerale === null ? (
          <p className="text-sm text-bj-gray-500">Aucune note disponible pour l&apos;instant.</p>
        ) : (
          <>
            <p className="text-3xl font-bold text-bj-green">
              {noteLisible(bilan.moyenneGenerale)}
              <span className="text-base font-medium text-bj-gray-500">/20</span>
            </p>
            <p className="text-xs text-bj-gray-500 mb-4v">Moyenne générale</p>
            {bilan.forces.length > 0 && (
              <p className="text-sm mb-1v">
                <span className="font-medium">{estParent ? 'Points forts' : 'Tes points forts'} :</span> {bilan.forces.join(', ')}
              </p>
            )}
            {bilan.aAmeliorer.length > 0 && (
              <p className="text-sm">
                <span className="font-medium">À renforcer :</span> {bilan.aAmeliorer.join(', ')}
              </p>
            )}
            <Link href="/espace-apprenant/notes" className={`${LIEN} inline-block mt-3v`}>
              Détail des notes →
            </Link>
          </>
        )}
      </Carte>

      <Carte titre="Orientation" icone={<GraduationCap size={18} />}>
        <EtapeOrientation profil={profil} preference={preference} estParent={estParent} />
      </Carte>

      {estParent && <ParentPilotage profil={profil} preference={preference} recommandations={recommandations ?? []} />}

      <section className="md:col-span-2">
        <div className="flex items-center justify-between mb-4v">
          <h2 className="text-xl font-bold">{profil.palier === 'QUATRIEME' ? 'Pistes à explorer' : 'Pistes recommandées'}</h2>
          <Link href="/espace-apprenant/recommandations" className={LIEN}>
            Tout voir →
          </Link>
        </div>
        {recommandations === null ? (
          <Chargement />
        ) : recommandations.length === 0 ? (
          <p className="text-sm text-bj-gray-500">
            Pas encore de recommandation.{' '}
            <Link href="/espace-apprenant/recommandations" className={LIEN}>
              Voir mes pistes
            </Link>
          </p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4v">
            {recommandations.slice(0, 3).map((r) => (
              <li key={r.id}>
                <Link href={`/catalogue/${r.filiere.id}`} className="bj-card block p-4v h-full">
                  <BadgeType type={r.filiere.type} />
                  <p className="font-bold mt-2v">{r.filiere.nom}</p>
                  <p className="text-sm text-bj-gray-500 mt-1v">Compatibilité {Math.round(r.score)}/100</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="md:col-span-2" aria-labelledby="titre-favoris">
        <div className="flex items-center justify-between mb-4v">
          <h2 id="titre-favoris" className="text-xl font-bold">
            {estEleve ? 'Mes formations mises de côté' : 'Formations mises de côté'}
          </h2>
          <Link href="/catalogue" className={LIEN}>
            Catalogue →
          </Link>
        </div>
        {favoris === null ? (
          <Chargement />
        ) : favoris.length === 0 ? (
          <p className="text-sm text-bj-gray-500">
            {estEleve
              ? 'Aucune pour l’instant. Dans le catalogue, appuie sur le cœur pour garder les formations qui t’intéressent : tu les retrouveras en saisissant tes vœux.'
              : `${profil.prenom} n'a pas encore mis de formation de côté.`}
          </p>
        ) : (
          <>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4v">
              {favoris.slice(0, 6).map((f) => (
                <li key={f.filiereId}>
                  <Link href={`/catalogue/${f.filiereId}`} className="bj-card block p-4v h-full">
                    <BadgeType type={f.filiere.type} />
                    <p className="font-bold mt-2v">{f.filiere.nom}</p>
                  </Link>
                </li>
              ))}
            </ul>
            {favoris.length > 6 && <p className="text-sm text-bj-gray-500 mt-3v">Et {favoris.length - 6} autre(s).</p>}
          </>
        )}
      </section>
    </div>
  );
}

function VueEnsemble({
  profil,
  decouverte,
  recommandations,
  favoris,
  preference,
  estParent,
}: {
  profil: ProfilApprenant;
  decouverte: Decouverte | null | undefined;
  recommandations: Recommandation[] | null;
  favoris: Favori[] | null;
  preference: Preference | null | undefined;
  estParent: boolean;
}) {
  const etapes = [
    { fait: !!decouverte, label: 'Profil d’intérêts', href: '/espace-apprenant/decouverte' },
    { fait: recommandations !== null && recommandations.length > 0, label: 'Pistes recommandées', href: '/espace-apprenant/recommandations' },
    { fait: favoris !== null && favoris.length > 0, label: 'Formations mises de côté', href: '/catalogue' },
    { fait: preference !== undefined && preference !== null, label: 'Vœux préparés', href: '/espace-apprenant/preferences' },
  ];
  const totalFait = etapes.filter((etape) => etape.fait).length;
  const progression = Math.round((totalFait / etapes.length) * 100);
  const prochaine = !decouverte
    ? { titre: 'Commencer mon profil', detail: 'Quelques réponses pour personnaliser tes pistes.', href: '/espace-apprenant/decouverte' }
    : recommandations === null
      ? { titre: 'Préparer tes pistes', detail: 'Les recommandations sont en cours de chargement.', href: '/espace-apprenant/recommandations' }
      : recommandations.length === 0
        ? { titre: 'Explorer le catalogue', detail: 'Découvre les formations techniques disponibles.', href: '/catalogue' }
        : favoris !== null && favoris.length === 0
          ? { titre: 'Garder une formation de côté', detail: 'Enregistre les pistes qui t’intéressent pour les comparer.', href: '/catalogue' }
          : preference === null && palierDeSaisie(profil.palier)
            ? { titre: 'Préparer mes vœux', detail: 'Organise tes choix avec ta famille.', href: '/espace-apprenant/preferences' }
            : { titre: 'Comparer mes pistes', detail: 'Mets deux formations côte à côte avant de décider.', href: '/catalogue/comparer' };

  return (
    <section className="md:col-span-2 rounded-bj-md border border-bj-green/25 bg-gradient-to-br from-white to-bj-green/5 p-4v md:p-6v" aria-labelledby="vue-ensemble">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5v">
        <div className="min-w-0">
          <div className="flex items-center gap-2v text-bj-green mb-2v"><ListChecks size={18} aria-hidden="true" /><p className="text-xs font-semibold uppercase tracking-[0.14em]">Vue d’ensemble</p></div>
          <h2 id="vue-ensemble" className="text-2xl font-bold">{estParent ? `Le parcours de ${profil.prenom}` : 'Ton parcours d’orientation'}</h2>
          <p className="text-sm text-bj-gray-500 mt-1v">{totalFait} étape{totalFait > 1 ? 's' : ''} sur {etapes.length} avancée{totalFait > 1 ? 's' : ''} · {progression}% du parcours repéré</p>
          <div className="h-2 max-w-xl rounded-full bg-bj-gray-925 mt-4v" role="progressbar" aria-valuenow={progression} aria-valuemin={0} aria-valuemax={100} aria-label="Progression du parcours d’orientation"><div className="h-full rounded-full bg-bj-green transition-[width] duration-500" style={{ width: `${progression}%` }} /></div>
        </div>
        <Link href={prochaine.href} className="group inline-flex shrink-0 items-center justify-between gap-4v rounded-bj-sm bg-bj-green px-4v py-3v text-white shadow-sm transition hover:bg-bj-green/90 hover:shadow-md focus-visible:outline-white">
          <span><span className="block text-xs text-white/75">Prochaine étape</span><span className="block font-semibold">{prochaine.titre}</span><span className="block text-xs text-white/80 mt-1v max-w-[16rem]">{prochaine.detail}</span></span>
          <ArrowRight size={19} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2v md:gap-3v mt-5v">
        {etapes.map((etape) => <Link key={etape.label} href={etape.href} className="flex items-center gap-2v rounded-bj-sm border border-bj-gray-925 bg-white/80 p-3v text-sm transition hover:border-bj-green/40 hover:bg-white"><span className={etape.fait ? 'text-bj-green' : 'text-bj-gray-500'}>{etape.fait ? <CheckCircle2 size={17} aria-hidden="true" /> : <Clock size={17} aria-hidden="true" />}</span><span className={etape.fait ? 'font-medium' : 'text-bj-gray-500'}>{etape.label}</span></Link>)}
      </div>
    </section>
  );
}

function ParentPilotage({ profil, preference, recommandations }: { profil: ProfilApprenant; preference: Preference | null | undefined; recommandations: Recommandation[] }) {
  return (
    <section className="md:col-span-2 rounded-bj-md border border-bj-blue/30 bg-bj-blue/5 p-4v md:p-5v" aria-labelledby="pilotage-parent">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3v mb-4v"><div><p className="text-xs font-semibold uppercase tracking-wide text-bj-blue">Pour accompagner {profil.prenom}</p><h2 id="pilotage-parent" className="text-xl font-bold">Les points à regarder ensemble</h2></div><Link href="/espace-apprenant/conseiller" className="text-sm font-medium text-bj-green hover:underline">Demander une explication à Guido →</Link></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3v">
        <div className="bg-white rounded-bj-sm p-3v"><p className="text-xs text-bj-gray-500 mb-1v">Pistes à examiner</p><p className="text-xl font-bold">{recommandations.length}</p><p className="text-xs text-bj-gray-500 mt-1v">recommandation{recommandations.length > 1 ? 's' : ''} disponible{recommandations.length > 1 ? 's' : ''}</p></div>
        <div className="bg-white rounded-bj-sm p-3v"><p className="text-xs text-bj-gray-500 mb-1v">Vœux</p><p className="text-xl font-bold">{preference ? (preference.valideParent ? 'Validés' : 'À relire') : 'À préparer'}</p><Link href="/espace-apprenant/preferences" className="text-xs text-bj-green hover:underline">Accéder aux vœux →</Link></div>
        <div className="bg-white rounded-bj-sm p-3v"><p className="text-xs text-bj-gray-500 mb-1v">Échange conseillé</p><p className="text-sm font-medium">Parler des envies et des contraintes de trajet, d’internat et de durée.</p></div>
      </div>
    </section>
  );
}

function EtapeOrientation({
  profil,
  preference,
  estParent,
}: {
  profil: ProfilApprenant;
  preference: Preference | null | undefined;
  estParent: boolean;
}) {
  if (!palierDeSaisie(profil.palier)) {
    return (
      <>
        <p className="text-sm mb-3v">
          {profil.palier === 'QUATRIEME'
            ? 'En 4e, découvre les formations qui correspondent à tes résultats, avant de choisir tes vœux en 3e.'
            : 'Les vœux se saisissent en 3e et en Terminale.'}
        </p>
        <Link href="/espace-apprenant/recommandations" className="bj-btn bj-btn-primary text-sm">
          Voir les pistes
        </Link>
      </>
    );
  }

  if (preference === undefined) return <Chargement />;

  if (!preference) {
    return (
      <>
        <p className="text-sm mb-3v">
          {estParent ? `${profil.prenom} n'a pas encore saisi ses vœux.` : "Tu n'as pas encore saisi tes vœux d'orientation."}
        </p>
        {!estParent && (
          <Link href="/espace-apprenant/preferences" className="bj-btn bj-btn-primary text-sm">
            Saisir mes vœux
          </Link>
        )}
      </>
    );
  }

  if (preference.valideParent) {
    return (
      <p className="flex items-start gap-2v text-sm text-bj-green font-medium">
        <CheckCircle2 size={18} className="shrink-0" aria-hidden="true" />
        Vœux validés par le parent le {dateLisible(preference.dateValidationParent as string)}.
      </p>
    );
  }

  return (
    <>
      <p className="flex items-start gap-2v text-sm mb-3v">
        <Clock size={18} className="shrink-0 text-bj-ochre-fonce" aria-hidden="true" />
        {estParent ? `Les vœux de ${profil.prenom} attendent ta validation.` : 'Vœux enregistrés, en attente de validation par ton parent.'}
      </p>
      <Link href="/espace-apprenant/preferences" className="bj-btn bj-btn-primary text-sm">
        {estParent ? 'Voir et valider' : 'Voir mes vœux'}
      </Link>
    </>
  );
}
