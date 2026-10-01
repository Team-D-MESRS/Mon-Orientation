'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle2, Circle, Heart, MessageCircle, Scale } from 'lucide-react';
import { apprenantApi, orientationApi } from '@/lib/api';
import {
  noteLisible,
  palierDeSaisie,
  type Decouverte,
  type Favori,
  type Preference,
  type ProfilApprenant,
  type Recommandation,
} from '@/lib/apprenant';
import { useEspace, useProfil } from '@/components/espace/EspaceContext';
import { NextActionCard, ParentSummary, ProgressOverview, RecommendationPreview } from '@/components/espace/dashboard';
import { ActionCard } from '@/components/ui/ActionCard';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';

const LIEN = 'text-sm font-medium text-primary hover:underline';

export default function TableauDeBordPage() {
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

  // Pas de redirection forcée vers la découverte quand `decouverte` vaut null : le mur d'entrée obligatoire
  // a été retiré (voir stores/authStore.ts, accueilDuRole) — la découverte est une étape proposée *depuis*
  // le tableau de bord (NextActionCard), jamais une destination imposée à l'arrivée sur cette page.

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

  // Un seul skeleton pour tout le contenu piloté par ces 4 signaux : les afficher un par un dès qu'ils
  // arrivent ferait changer la Vue d'ensemble et la prochaine étape plusieurs fois de suite sous les yeux
  // de l'utilisateur (ils se chargent en parallèle, l'écart est de toute façon bref).
  const pret = decouverte !== undefined && recommandations !== null && favoris !== null && preference !== undefined;

  const etapes = [
    { fait: !!decouverte, label: 'Profil d’intérêts', href: '/espace-apprenant/decouverte' },
    { fait: recommandations !== null && recommandations.length > 0, label: 'Pistes recommandées', href: '/espace-apprenant/recommandations' },
    { fait: favoris !== null && favoris.length > 0, label: 'Formations sauvegardées', href: '/catalogue' },
    { fait: preference !== undefined && preference !== null, label: 'Vœux préparés', href: '/espace-apprenant/preferences' },
  ];
  const totalFait = etapes.filter((e) => e.fait).length;
  const progression = Math.round((totalFait / etapes.length) * 100);

  const prochaine = calculerProchaineEtape({ profil, estParent, decouverte, recommandations, favoris, preference });

  if (!pret) return <SilhouetteTableauDeBord />;

  return (
    <div className="space-y-10v stagger-sections">
      <ProgressOverview
        prenom={profil.prenom}
        decouverte={decouverte}
        recommandations={recommandations}
        favoris={favoris}
        preference={preference}
        progression={progression}
        estParent={estParent}
      />

      <NextActionCard
        titre={prochaine.titre}
        justification={prochaine.justification}
        actionLabel={prochaine.actionLabel}
        href={prochaine.href}
        parcoursComplet={prochaine.parcoursComplet}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6v items-start">
        <EtapesParcours etapes={etapes} estParent={estParent} prenom={profil.prenom} />

        <section aria-labelledby="titre-resultats">
          {/* SectionHeader ici plutôt que le titre interne de <Carte> (comme pour « Ton parcours » à
              gauche) : les deux colonnes ont ainsi un en-tête de même hauteur, et les deux cartes qui
              suivent démarrent exactement à la même ligne — sans ça, celle de droite, sans en-tête propre,
              remontait plus haut que la liste d'étapes. */}
          <SectionHeader as="h2" id="titre-resultats" title={`Résultats ${profil.bilan.anneeScolaire ?? ''}`} className="mb-4v" />
          <Card>
            {profil.bilan.moyenneGenerale === null ? (
              <p className="text-sm text-text-secondary">Aucune note disponible pour l&apos;instant.</p>
            ) : (
              <>
                <p className="text-3xl font-bold text-primary">
                  {noteLisible(profil.bilan.moyenneGenerale)}
                  <span className="text-base font-medium text-text-secondary">/20</span>
                </p>
                <p className="text-xs text-text-secondary mb-4v">Moyenne générale</p>
                {profil.bilan.forces.length > 0 && (
                  <p className="text-sm mb-1v">
                    <span className="font-medium">{estParent ? 'Points forts' : 'Tes points forts'} :</span> {profil.bilan.forces.join(', ')}
                  </p>
                )}
                {profil.bilan.aAmeliorer.length > 0 && (
                  <p className="text-sm">
                    <span className="font-medium">À renforcer :</span> {profil.bilan.aAmeliorer.join(', ')}
                  </p>
                )}
                <Link href="/espace-apprenant/notes" className={`${LIEN} inline-block mt-3v`}>
                  Détail des notes →
                </Link>
              </>
            )}
          </Card>
        </section>
      </div>

      {estParent && <ParentSummary prenom={profil.prenom} decouverte={decouverte} recommandations={recommandations} />}

      <section aria-labelledby="titre-recommandations">
        <SectionHeader
          as="h2"
          id="titre-recommandations"
          title={profil.palier === 'QUATRIEME' ? 'Pistes à explorer' : 'Pistes recommandées'}
          action={
            <Link href="/espace-apprenant/recommandations" className={LIEN}>
              Tout voir →
            </Link>
          }
          className="mb-4v"
        />
        {recommandations && recommandations.length > 0 ? (
          <RecommendationPreview recommandations={recommandations.slice(0, 3)} />
        ) : (
          <EmptyState
            title="Pas encore de recommandation"
            description={
              estParent
                ? `Elles apparaîtront ici une fois le profil de découverte et les résultats de ${profil.prenom} pris en compte.`
                : 'Elles apparaîtront ici une fois ton profil de découverte et tes résultats pris en compte.'
            }
            action={
              <Link href="/espace-apprenant/recommandations" className={LIEN}>
                Voir mes pistes →
              </Link>
            }
          />
        )}
      </section>

      <section aria-labelledby="titre-explorer">
        <SectionHeader as="h2" id="titre-explorer" title="À explorer ensuite" className="mb-4v" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4v">
          <ActionCard
            href="/catalogue"
            icon={<BookOpen size={22} aria-hidden="true" />}
            title="Le catalogue"
            description="Toutes les formations techniques, par domaine et par département."
            actionLabel="Explorer"
          />
          <ActionCard
            href="/catalogue/comparer"
            icon={<Scale size={22} aria-hidden="true" />}
            title="Le comparateur"
            description={estParent ? 'Comparez deux ou trois formations avant de décider.' : 'Mets deux ou trois formations côte à côte avant de décider.'}
            actionLabel="Comparer"
          />
          <ActionCard
            href="/espace-apprenant/conseiller"
            icon={<MessageCircle size={22} aria-hidden="true" />}
            title="Guido"
            description={estParent ? 'Posez une question sur une formation, un métier ou une piste.' : 'Pose une question sur une formation, un métier ou une piste.'}
            actionLabel="Discuter"
          />
          <ActionCard
            href="/espace-apprenant/preferences"
            icon={<Heart size={22} aria-hidden="true" />}
            title={estEleve ? 'Mes vœux' : 'Les vœux'}
            description={
              !palierDeSaisie(profil.palier)
                ? 'Se préparent en 3e et en Terminale.'
                : estParent
                  ? `Préparez et enregistrez les choix de ${profil.prenom}, en famille.`
                  : 'Prépare et enregistre tes choix, avec ta famille.'
            }
            actionLabel="Voir les vœux"
          />
        </div>
      </section>
    </div>
  );
}

type StatutEtape = 'termine' | 'afaire';

const STYLE_STATUT: Record<StatutEtape, { icone: ReactNode; texte: string; classe: string }> = {
  termine: { icone: <CheckCircle2 size={17} aria-hidden="true" />, texte: 'Terminé', classe: 'text-primary' },
  afaire: { icone: <Circle size={17} aria-hidden="true" />, texte: 'À faire', classe: 'text-text-secondary' },
};

function EtapesParcours({
  etapes,
  estParent,
  prenom,
}: {
  etapes: { fait: boolean; label: string; href: string }[];
  estParent: boolean;
  prenom: string;
}) {
  const statuts: StatutEtape[] = etapes.map((etape) => (etape.fait ? 'termine' : 'afaire'));

  return (
    <section aria-labelledby="titre-progression">
      <SectionHeader
        as="h2"
        id="titre-progression"
        title={estParent ? `Le parcours de ${prenom}, étape par étape` : 'Ton parcours, étape par étape'}
        className="mb-4v"
      />
      <ol className="bg-surface rounded-bj-md border border-border divide-y divide-border">
        {etapes.map((etape, i) => {
          const statut = STYLE_STATUT[statuts[i]];
          return (
            <li key={etape.href}>
              <Link href={etape.href} className="flex items-center gap-3v p-4v transition-colors hover:bg-surface-sunken">
                <span className={`shrink-0 ${statut.classe}`} aria-hidden="true">
                  {statut.icone}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-medium">{etape.label}</span>
                  <span className={`block text-xs ${statut.classe}`}>{statut.texte}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Silhouette pleine page (mêmes proportions que le contenu réel) le temps que les 4 signaux du tableau de bord arrivent. */
function SilhouetteTableauDeBord() {
  return (
    <div className="space-y-10v" aria-busy="true" aria-label="Chargement du tableau de bord">
      <div className="flex items-end justify-between gap-5v">
        <div className="space-y-2v">
          <div className="h-6 w-48 rounded-bj-sm bg-surface-sunken skeleton-pulse" />
          <div className="h-4 w-72 rounded-bj-sm bg-surface-sunken skeleton-pulse" />
        </div>
        <div className="h-11 w-40 rounded-bj-sm bg-surface-sunken skeleton-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4v">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-bj-md bg-surface-sunken skeleton-pulse" />
        ))}
      </div>
      <div className="h-40 rounded-bj-lg bg-surface-sunken skeleton-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6v">
        <div className="h-64 rounded-bj-md bg-surface-sunken skeleton-pulse" />
        <div className="h-64 rounded-bj-md bg-surface-sunken skeleton-pulse" />
      </div>
    </div>
  );
}

interface ProchaineEtape {
  titre: string;
  justification: string;
  actionLabel: string;
  href: string;
  parcoursComplet?: boolean;
}

/** Une seule action prioritaire à la fois, dérivée du vrai état du dossier — jamais plusieurs en parallèle. */
function calculerProchaineEtape({
  profil,
  estParent,
  decouverte,
  recommandations,
  favoris,
  preference,
}: {
  profil: ProfilApprenant;
  estParent: boolean;
  decouverte: Decouverte | null | undefined;
  recommandations: Recommandation[] | null;
  favoris: Favori[] | null;
  preference: Preference | null | undefined;
}): ProchaineEtape {
  if (!decouverte) {
    return estParent
      ? {
          titre: `Le profil de découverte de ${profil.prenom}`,
          justification: `Quelques réponses suffisent pour personnaliser ses pistes de formation : c’est le point de départ du parcours.`,
          actionLabel: 'Voir le questionnaire',
          href: '/espace-apprenant/decouverte',
        }
      : {
          titre: 'Ton profil de découverte',
          justification: 'Réponds à quelques questions sur ce qui te plaît : c’est ce qui rend tes pistes personnelles.',
          actionLabel: 'Commencer le questionnaire',
          href: '/espace-apprenant/decouverte',
        };
  }
  if (recommandations === null || recommandations.length === 0) {
    return estParent
      ? {
          titre: 'Les premières pistes',
          justification: `À partir de son profil et de ses résultats, calculez les formations qui correspondent le mieux à ${profil.prenom}.`,
          actionLabel: 'Voir les pistes',
          href: '/espace-apprenant/recommandations',
        }
      : {
          titre: 'Tes premières pistes',
          justification: 'À partir de ton profil et de tes résultats, découvre les formations qui te correspondent.',
          actionLabel: 'Voir mes pistes',
          href: '/espace-apprenant/recommandations',
        };
  }
  if (favoris !== null && favoris.length === 0) {
    return estParent
      ? {
          titre: 'Des formations à garder de côté',
          // C'est ${profil.prenom} qui met de côté (le cœur du catalogue n'est actif que pour l'élève
          // connecté, pas pour le compte parent) : ne pas laisser croire que « vous » (le parent) peut le
          // faire depuis son propre catalogue, sans quoi la promesse ne correspond à rien de cliquable.
          justification: `Parcourez le catalogue ensemble : ${profil.prenom} peut mettre de côté les formations qui l'intéressent, pour les retrouver au moment de préparer les vœux.`,
          actionLabel: 'Explorer le catalogue',
          href: '/catalogue',
        }
      : {
          titre: 'Des formations à garder de côté',
          justification: 'Dans le catalogue, appuie sur le cœur pour garder les formations qui t’intéressent.',
          actionLabel: 'Explorer le catalogue',
          href: '/catalogue',
        };
  }
  if (palierDeSaisie(profil.palier) && preference === null) {
    return estParent
      ? {
          titre: 'Les vœux à préparer',
          justification: `${profil.prenom} peut maintenant organiser ses choix, avec vous.`,
          actionLabel: 'Voir les vœux',
          href: '/espace-apprenant/preferences',
        }
      : {
          titre: 'Tes vœux d’orientation',
          justification: 'Organise et enregistre tes choix, avec ta famille.',
          actionLabel: 'Saisir mes vœux',
          href: '/espace-apprenant/preferences',
        };
  }
  return estParent
    ? {
        titre: `Le parcours de ${profil.prenom} est à jour`,
        justification: 'Vous pouvez comparer les pistes préférées ou en discuter avec Guido avant de décider ensemble.',
        actionLabel: 'Comparer les pistes',
        href: '/catalogue/comparer',
        parcoursComplet: true,
      }
    : {
        titre: 'Ton parcours est à jour',
        justification: 'Tu peux comparer tes pistes préférées ou en discuter avec Guido avant de décider.',
        actionLabel: 'Comparer mes pistes',
        href: '/catalogue/comparer',
        parcoursComplet: true,
      };
}
