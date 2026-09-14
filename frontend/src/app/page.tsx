import Link from 'next/link';
import {
  ArrowRight,
  Backpack,
  BookOpen,
  ClipboardList,
  Compass,
  GraduationCap,
  Languages,
  Lightbulb,
  Lock,
  Search,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { ActionsHero } from '@/components/accueil/ActionsHero';
import { ApresLeBac } from '@/components/accueil/ApresLeBac';
import { Domaines } from '@/components/accueil/Domaines';

const PROFILS: { Icone: LucideIcon; titre: string; texte: string; href: string; action: string }[] = [
  {
    Icone: Backpack,
    titre: 'En 4e ou en 3e',
    texte: 'Explore les formations après le BEPC : lycée général, technique ou agricole, métiers. En 3e, tu saisis tes vœux.',
    href: '/catalogue?niveau=APRES_BEPC',
    action: 'Formations après le BEPC',
  },
  {
    Icone: GraduationCap,
    titre: 'En 1re ou en Terminale',
    texte: 'Découvre les formations du supérieur accessibles avec ta série. En Terminale, tu saisis tes vœux.',
    href: '/catalogue?niveau=APRES_BAC',
    action: 'Formations après le bac',
  },
  {
    Icone: Users,
    titre: 'Parent ou tuteur',
    texte: 'Suivez les résultats de votre enfant, validez ses vœux et posez vos questions au conseiller, en français ou en fongbé.',
    href: '/guide#parent',
    action: 'Suivre mon enfant',
  },
];

const ETAPES: { Icone: LucideIcon; titre: string; texte: string }[] = [
  { Icone: Search, titre: 'Explore', texte: 'Parcours le catalogue, compare les formations et mets de côté celles qui te plaisent.' },
  { Icone: Lightbulb, titre: 'Découvre tes pistes', texte: 'À partir de tes notes, la plateforme te propose des formations et t’explique pourquoi.' },
  { Icone: ClipboardList, titre: 'Saisis tes vœux', texte: 'En 3e et en Terminale, choisis jusqu’à 3 formations, par ordre de préférence.' },
  { Icone: Users, titre: 'Décide en famille', texte: 'Ton parent valide tes vœux. La décision t’appartient, avec ta famille.' },
];

const GARANTIES: { Icone: LucideIcon; titre: string; texte: string }[] = [
  {
    Icone: BookOpen,
    titre: 'Des informations sourcées',
    texte: 'Chaque fiche cite ses sources. Tant qu’une information n’est pas validée par le Ministère, elle porte la mention « À confirmer ».',
  },
  {
    Icone: Compass,
    titre: 'La plateforme propose, tu décides',
    texte: 'Chaque piste est expliquée critère par critère. La décision d’orientation revient à l’élève et à sa famille.',
  },
  {
    Icone: Lock,
    titre: 'Un dossier protégé',
    texte: 'Seuls l’élève, son parent rattaché et les administrateurs habilités voient le dossier scolaire.',
  },
];

export default function Accueil() {
  return (
    <>
      {/* Bandeau principal : recherche directe et raccourci par série */}
      <section className="bg-white border-b border-bj-gray-925">
        <div className="bj-container py-12v lg:py-16v grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-12v items-center">
          <div>
            <p className="inline-flex items-center gap-2v px-3v py-1v rounded-full bg-bj-green/10 text-bj-green text-sm font-semibold mb-4v">
              <Compass size={16} aria-hidden="true" /> Plateforme nationale d&apos;orientation scolaire
            </p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4v">Choisis ton avenir avec confiance</h1>
            <p className="text-lg text-bj-gray-500 mb-8v max-w-xl">
              De la 4e à la Terminale, découvre les formations, comprends tes résultats et prépare tes vœux d&apos;orientation, avec ta
              famille.
            </p>

            <form action="/catalogue" role="search" className="flex flex-col sm:flex-row gap-2v max-w-xl mb-3v">
              <label htmlFor="recherche-accueil" className="sr-only">
                Rechercher une formation, un métier ou une ville
              </label>
              <div className="relative flex-1">
                <Search className="absolute left-3v top-1/2 -translate-y-1/2 text-bj-gray-500" size={20} aria-hidden="true" />
                <input
                  id="recherche-accueil"
                  name="q"
                  type="search"
                  placeholder="Une formation, un métier, une ville…"
                  className="w-full pl-10 pr-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-bj-green"
                />
              </div>
              <button type="submit" className="bj-btn bj-btn-primary">
                Rechercher
              </button>
            </form>
            <Link href="/catalogue" className="inline-flex items-center gap-1v text-sm font-medium text-bj-green hover:underline mb-8v">
              ou parcourir tout le catalogue <ArrowRight size={14} aria-hidden="true" />
            </Link>

            <ActionsHero />
          </div>

          <ApresLeBac />
        </div>
      </section>

      {/* Entrées selon le profil */}
      <section className="py-12v">
        <div className="bj-container">
          <h2 className="text-2xl md:text-3xl font-bold mb-2v">Par où commencer&nbsp;?</h2>
          <p className="text-bj-gray-500 mb-8v">Selon ta classe, la plateforme t&apos;accompagne différemment.</p>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6v">
            {PROFILS.map(({ Icone, titre, texte, href, action }) => (
              <li key={titre}>
                <Link href={href} className="bj-card flex flex-col h-full p-6v group">
                  <span className="w-12 h-12 rounded-full bg-bj-green text-white flex items-center justify-center mb-4v">
                    <Icone size={24} aria-hidden="true" />
                  </span>
                  <span className="text-lg font-bold mb-2v">{titre}</span>
                  <span className="text-sm text-bj-gray-500 flex-1 mb-4v">{texte}</span>
                  <span className="inline-flex items-center gap-1v text-sm font-medium text-bj-green group-hover:underline">
                    {action} <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Parcours */}
      <section className="py-12v bg-white border-y border-bj-gray-925">
        <div className="bj-container">
          <h2 className="text-2xl md:text-3xl font-bold mb-8v">Comment ça marche&nbsp;?</h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6v">
            {ETAPES.map(({ Icone, titre, texte }, i) => (
              <li key={titre} className="relative pl-14">
                <span
                  className="absolute left-0 top-0 w-10 h-10 rounded-full border-2 border-bj-green text-bj-green font-bold flex items-center justify-center"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <h3 className="flex items-center gap-2v font-bold mb-1v">
                  <Icone size={18} className="text-bj-green" aria-hidden="true" />
                  <span>
                    <span className="sr-only">Étape {i + 1} : </span>
                    {titre}
                  </span>
                </h3>
                <p className="text-sm text-bj-gray-500">{texte}</p>
              </li>
            ))}
          </ol>
          <Link href="/guide" className="inline-flex items-center gap-1v mt-8v text-sm font-medium text-bj-green hover:underline">
            Lire le guide d&apos;utilisation <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Domaines */}
      <section className="py-12v">
        <div className="bj-container">
          <h2 className="text-2xl md:text-3xl font-bold mb-2v">Explore par domaine</h2>
          <Domaines />
        </div>
      </section>

      {/* Conseiller en fongbé */}
      <section className="py-12v bg-white border-y border-bj-gray-925">
        <div className="bj-container grid grid-cols-1 lg:grid-cols-2 gap-8v items-center">
          <div>
            <p className="inline-flex items-center gap-2v px-3v py-1v rounded-full bg-bj-blue/10 text-bj-blue text-sm font-semibold mb-4v">
              <Languages size={16} aria-hidden="true" /> Nouveau
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3v">Le conseiller répond aussi en fongbé</h2>
            <p className="text-bj-gray-500 mb-3v">
              Pose tes questions sur les formations, les métiers et tes pistes. Choisis « Fɔ̀ngbè » : le conseiller te répond dans ta
              langue, en s&apos;appuyant sur le catalogue et sur ton dossier.
            </p>
            <p className="text-xs text-bj-gray-500 mb-6v">
              Réponses rédigées automatiquement. Le conseiller explique, il ne décide pas à ta place.
            </p>
            <Link href="/conseiller" className="bj-btn bj-btn-primary">
              Poser une question
            </Link>
          </div>

          <figure className="rounded-bj-lg border border-bj-gray-925 bg-bj-gray-975 p-6v space-y-3v">
            <div className="flex justify-end">
              <p className="bubble-user max-w-[85%] text-sm">Bonjour&nbsp;!</p>
            </div>
            <div className="flex justify-start">
              <div className="bubble-assistant max-w-[85%]">
                <p lang="fon" className="text-sm font-medium">
                  A fɔ́n à, azɔ̌kplɔ́n tɛ́ a jló na bló ɖò bákì gudo&nbsp;?
                </p>
                <p className="text-xs text-bj-gray-500 mt-1v">« Bonjour, quelle formation veux-tu faire après le bac&nbsp;? »</p>
              </div>
            </div>
            <figcaption className="text-xs text-bj-gray-500 text-center pt-2v">Exemple de réponse en fongbé, avec sa traduction</figcaption>
          </figure>
        </div>
      </section>

      {/* Garanties */}
      <section className="py-12v">
        <div className="bj-container">
          <h2 className="sr-only">Nos engagements</h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-8v">
            {GARANTIES.map(({ Icone, titre, texte }) => (
              <li key={titre} className="flex gap-4v">
                <Icone size={24} className="text-bj-green shrink-0 mt-[2px]" aria-hidden="true" />
                <div>
                  <h3 className="font-bold mb-1v">{titre}</h3>
                  <p className="text-sm text-bj-gray-500">{texte}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-bj-gray-500">
            Besoin d&apos;aide&nbsp;?{' '}
            <Link href="/guide" className="font-medium text-bj-green hover:underline">
              Guide d&apos;utilisation
            </Link>{' '}
            ·{' '}
            <Link href="/faq" className="font-medium text-bj-green hover:underline">
              Questions fréquentes
            </Link>{' '}
            ·{' '}
            <Link href="/donnees-personnelles" className="font-medium text-bj-green hover:underline">
              Données personnelles
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
