'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { BookOpen, Compass, FlaskConical, Heart, LayoutDashboard, Lightbulb, UserSearch, Users } from 'lucide-react';
import { classeLisible } from '@/lib/apprenant';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useEspace } from './EspaceContext';
import { Alerte, CHAMP, Chargement } from './ui';

const ONGLETS = [
  { href: '/espace-apprenant', label: 'Tableau de bord', Icone: LayoutDashboard },
  { href: '/espace-apprenant/decouverte', label: 'Découverte', Icone: Compass },
  { href: '/espace-apprenant/notes', label: 'Notes', Icone: BookOpen },
  { href: '/espace-apprenant/preferences', label: 'Vœux', Icone: Heart },
  { href: '/espace-apprenant/recommandations', label: 'Recommandations', Icone: Lightbulb },
];

const CLE_DEJA_VISITE = 'mon-orientation:espace-deja-visite';

/** Salutation du bandeau : « Bienvenue » à la toute première visite de l'espace sur cet appareil (repérée
 * via une marque locale, faute d'historique de connexion côté serveur), sinon selon le moment de la
 * journée. Calculée une fois au montage, pas en continu : un intitulé qui changerait sous les yeux d'un
 * onglet resté ouvert serait plus surprenant qu'utile. */
function useSalutation(prenom: string): string {
  const [dejaVisite] = useState(() => typeof window !== 'undefined' && !!localStorage.getItem(CLE_DEJA_VISITE));
  useEffect(() => {
    try {
      localStorage.setItem(CLE_DEJA_VISITE, '1');
    } catch {
      // Stockage indisponible (navigation privée, quota…) : la salutation retombera simplement sur « Bienvenue »
      // à chaque visite plutôt que de bloquer quoi que ce soit.
    }
  }, []);
  if (!dejaVisite) return `Bienvenue, ${prenom}`;
  const heure = new Date().getHours();
  if (heure < 12) return `Bonjour, ${prenom}`;
  if (heure < 18) return `Bon après-midi, ${prenom}`;
  if (heure < 22) return `Bonsoir, ${prenom}`;
  return `Bonne soirée, ${prenom}`;
}

/** Silhouette du cadre le temps du tout premier chargement (aucun dossier encore connu) : même gabarit que
 * le contenu réel (bandeau titre, rangée d'onglets, quelques blocs), pour ne pas faire sauter la mise en
 * page une fois les données arrivées. */
function SilhouetteEspace() {
  return (
    <div className="py-8v" aria-busy="true" aria-label="Chargement de l’espace">
      <div className="bj-container">
        <div className="mb-6v space-y-2v">
          <div className="h-3 w-40 rounded-full bg-surface-sunken skeleton-pulse" />
          <div className="h-8 w-64 rounded-bj-sm bg-surface-sunken skeleton-pulse" />
        </div>
        <div className="flex gap-2v mb-8v overflow-hidden">
          {ONGLETS.map((o) => (
            <div key={o.href} className="h-10 w-32 shrink-0 rounded-bj-sm bg-surface-sunken skeleton-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6v">
          <div className="h-40 rounded-bj-md bg-surface-sunken skeleton-pulse md:col-span-2" />
          <div className="h-40 rounded-bj-md bg-surface-sunken skeleton-pulse" />
          <div className="h-40 rounded-bj-md bg-surface-sunken skeleton-pulse" />
        </div>
      </div>
    </div>
  );
}

export function CadreEspace({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { moi, nip, choisirNip, profil, chargementProfil, erreurProfil, estParent } = useEspace();
  const [nipSaisi, setNipSaisi] = useState('');
  const estAdmin = moi.role === 'ADMIN';
  // Toujours appelé (règle des hooks) : le résultat n'est utilisé que pour un élève avec un dossier chargé.
  const salutation = useSalutation(profil?.prenom ?? '');

  // Premier chargement (aucun dossier encore vu) : silhouette pleine page plutôt qu'un « Chargement… »
  // isolé, pour ne pas faire apparaître d'un coup le bandeau titre et la rangée d'onglets qui suivent.
  if (chargementProfil && !profil) return <SilhouetteEspace />;

  const titre = estParent && profil ? `Suivi de ${profil.prenom}` : estAdmin ? 'Dossier élève' : salutation;
  // « Mon espace » ne sert d'eyebrow que pour l'élève, là où le titre est devenu une salutation à sa place :
  // pour le parent et l'admin, le titre (« Suivi de X », « Dossier élève ») reste la donnée structurelle, et
  // l'eyebrow continue de nommer la plateforme.
  const eyebrow = estParent || estAdmin ? 'Mon Orientation' : 'Mon espace';
  const surDecouverte = pathname === '/espace-apprenant/decouverte';

  const ouvrirDossier = (e: FormEvent) => {
    e.preventDefault();
    if (nipSaisi.trim()) choisirNip(nipSaisi.trim());
  };

  let contenu: ReactNode;
  if (chargementProfil) contenu = <Chargement texte="Chargement du dossier…" />;
  else if (erreurProfil) contenu = <Alerte ton="erreur">{erreurProfil}</Alerte>;
  else if (profil) contenu = children;
  else if (estParent) {
    contenu = (
      <EmptyState
        icon={<Users size={22} aria-hidden="true" />}
        title="Aucun enfant rattaché à ton compte"
        description="Ton établissement doit rattacher ton compte au dossier de ton enfant."
      />
    );
  } else if (estAdmin) {
    contenu = (
      <EmptyState icon={<UserSearch size={22} aria-hidden="true" />} title="Aucun dossier ouvert" description="Saisis le NIP d’un élève ci-dessus pour consulter son dossier." />
    );
  } else {
    contenu = (
      <EmptyState
        icon={<Users size={22} aria-hidden="true" />}
        title="Compte non rattaché"
        description="Ton compte n’est rattaché à aucun dossier élève."
      />
    );
  }

  return (
    <div>
      {/* Bandeau de section : identité du dossier consulté + sélecteur (parent/admin). Palier intermédiaire
          entre la navigation principale (en-tête) et le contenu de page. */}
      <div className={`bj-subheader ${surDecouverte ? 'py-6v md:py-10v' : 'py-6v'}`}>
        <div className="bj-container">
          <div className={`flex flex-col md:flex-row md:items-end md:justify-between gap-4v ${surDecouverte ? 'mb-2v' : ''}`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] mb-2v ${surDecouverte ? 'text-primary' : 'text-text-secondary'}`}>
                {surDecouverte ? 'Mon Orientation · Première étape' : eyebrow}
              </p>
              <h1 className={`${surDecouverte ? 'text-3xl md:text-4xl font-serif' : 'text-2xl md:text-3xl'} font-bold mb-1v`}>
                {surDecouverte && profil ? `Bienvenue, ${profil.prenom}` : titre}
              </h1>
              {profil && !surDecouverte && (
                <p className="text-text-secondary text-sm">
                  {profil.prenom} {profil.nom} · {classeLisible(profil)} · {profil.departement} ({profil.commune}) · NIP {profil.nip}
                </p>
              )}
              {surDecouverte && profil && (
                <p className="bj-subheader-intro text-base text-text-secondary max-w-2xl">
                  Quelques réponses nous aideront à te présenter des formations qui correspondent à tes envies, à ton profil et à ta situation.
                </p>
              )}
            </div>

            {estParent && moi.enfants.length > 1 && (
              <div>
                <label htmlFor="enfant" className="block text-sm font-medium mb-1v">
                  Enfant suivi
                </label>
                <select id="enfant" value={nip ?? ''} onChange={(e) => choisirNip(e.target.value)} className={CHAMP}>
                  {moi.enfants.map((enfant) => (
                    <option key={enfant.nip} value={enfant.nip}>
                      {enfant.prenom} {enfant.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {estAdmin && (
              <form onSubmit={ouvrirDossier} className="flex gap-2v items-end">
                <div>
                  <label htmlFor="nip-dossier" className="block text-sm font-medium mb-1v">
                    NIP de l&apos;élève
                  </label>
                  <input id="nip-dossier" value={nipSaisi} onChange={(e) => setNipSaisi(e.target.value)} className={CHAMP} />
                </div>
                <Button type="submit" variant="secondary">
                  Ouvrir
                </Button>
              </form>
            )}
          </div>

          {nip?.startsWith('DEMO-') && (
            <div role="note" className="flex gap-2v items-center p-3v mt-4v rounded-bj-sm border border-info/30 bg-info-soft text-sm">
              <FlaskConical size={16} className="text-info shrink-0" aria-hidden="true" />
              Dossier de démonstration : élève et notes fictifs, en attendant la connexion à EducMaster.
            </div>
          )}

          {profil && (
            <nav aria-label="Espace apprenant" className="flex gap-2v mt-6v overflow-x-auto pb-1v">
              {ONGLETS.map(({ href, label, Icone }) => {
                // Comparaison stricte, pas estLienActif (préfixe) : l'onglet « Tableau de bord » a pour
                // route /espace-apprenant, qui est elle-même le préfixe de tous les autres onglets — en
                // préfixe, il resterait actif partout dans l'espace, en plus de l'onglet réellement ouvert.
                const actif = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={actif ? 'page' : undefined}
                    className={`flex items-center gap-2v px-4v py-2v rounded-bj-sm text-sm font-medium whitespace-nowrap transition-colors ${
                      actif ? 'bg-primary text-text-on-primary' : 'bg-surface border border-border text-text-secondary hover:border-primary hover:text-text'
                    }`}
                  >
                    <Icone size={16} aria-hidden="true" /> {label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>

      <div className="bj-container py-8v">{contenu}</div>
    </div>
  );
}
