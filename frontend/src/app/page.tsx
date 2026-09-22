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
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { ActionsHero } from '@/components/accueil/ActionsHero';
import { CTADecouverte } from '@/components/accueil/CTADecouverte';
import { ApresLeBac } from '@/components/accueil/ApresLeBac';
import { Domaines } from '@/components/accueil/Domaines';
import { Apparition } from '@/components/animation/Apparition';
import { ActionCard } from '@/components/ui/ActionCard';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';

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
    texte: 'Suivez les résultats de votre enfant, validez ses vœux et posez vos questions à Guido, en français, en fongbé ou en note vocale.',
    href: '/guide#parent',
    action: 'Suivre mon enfant',
  },
];

const ETAPES: { Icone: LucideIcon; titre: string; texte: string }[] = [
  {
    Icone: Sparkles,
    titre: 'Réponds au questionnaire',
    texte: "D'abord, dis-nous ce qui te plaît et tes ambitions : 5 étapes, quelques minutes. C'est ce qui rend tes pistes personnelles.",
  },
  { Icone: Search, titre: 'Explore', texte: 'Parcours le catalogue, compare les formations et mets de côté celles qui te plaisent.' },
  { Icone: Lightbulb, titre: 'Découvre tes pistes', texte: 'À partir de tes résultats et de tes réponses, la plateforme te propose des formations et t’explique pourquoi.' },
  { Icone: ClipboardList, titre: 'Saisis tes vœux', texte: 'En 3e et en Terminale, indique tes préférences de formation, par ordre d’importance.' },
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

/** Titre de section qui apparaît au défilement */
function TitreSection({ titre, sousTitre, marge = 'mb-8v' }: { titre: string; sousTitre?: string; marge?: string }) {
  return (
    <Apparition className={marge}>
      <SectionHeader title={titre} subtitle={sousTitre} />
    </Apparition>
  );
}

export default function Accueil() {
  return (
    <>
      {/* Bandeau principal : recherche directe et raccourci par série (apparition en cascade au chargement) */}
      <section className="bg-surface border-b border-border overflow-hidden">
        <div className="bj-container py-12v lg:py-16v grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-12v items-center">
          <div>
            <Apparition
              as="p"
              className="inline-flex items-center gap-2v px-3v py-1v rounded-full bg-primary-soft text-primary text-sm font-semibold mb-4v"
            >
              <Compass size={16} aria-hidden="true" /> Plateforme nationale d&apos;orientation scolaire
            </Apparition>
            <Apparition as="h1" delai={80} className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-4v">
              Choisis ton avenir avec confiance
            </Apparition>
            <Apparition as="p" delai={160} className="text-lg text-text-secondary mb-8v max-w-xl">
              De la 4e à la Terminale, découvre les formations, comprends tes résultats et prépare tes vœux d&apos;orientation, avec ta
              famille.
            </Apparition>

            <Apparition delai={240}>
              <form action="/catalogue" role="search" className="flex flex-col sm:flex-row gap-2v max-w-xl mb-3v">
                <label htmlFor="recherche-accueil" className="sr-only">
                  Rechercher une formation, un métier ou une ville
                </label>
                <div className="relative flex-1">
                  <Search className="absolute left-3v top-1/2 -translate-y-1/2 text-text-secondary" size={20} aria-hidden="true" />
                  <input
                    id="recherche-accueil"
                    name="q"
                    type="search"
                    placeholder="Une formation, un métier, une ville…"
                    className="w-full pl-10 pr-4v py-3v border border-border-strong rounded-bj-sm text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button type="submit" className="bj-btn bj-btn-primary">
                  Rechercher
                </button>
              </form>
              <Link href="/catalogue" className="inline-flex items-center gap-1v text-sm font-medium text-primary hover:underline mb-8v">
                ou parcourir tout le catalogue <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </Apparition>

            <Apparition delai={320}>
              <ActionsHero />
            </Apparition>
          </div>

          <Apparition effet="droite" delai={200}>
            <ApresLeBac />
          </Apparition>
        </div>
      </section>

      {/* Entrées selon le profil */}
      <section className="py-12v">
        <div className="bj-container">
          <TitreSection titre="Par où commencer ?" sousTitre="Selon ta classe, la plateforme t'accompagne différemment." />
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6v">
            {PROFILS.map(({ Icone, titre, texte, href, action }, i) => (
              <Apparition as="li" key={titre} delai={i * 120}>
                <ActionCard href={href} icon={<Icone size={24} aria-hidden="true" />} title={titre} description={texte} actionLabel={action} />
              </Apparition>
            ))}
          </ul>
        </div>
      </section>

      {/* Parcours : les étapes apparaissent l'une après l'autre */}
      <section className="py-12v bg-surface border-y border-border">
        <div className="bj-container">
          <TitreSection titre="Comment ça marche ?" />
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6v">
            {ETAPES.map(({ Icone, titre, texte }, i) => (
              <Apparition as="li" key={titre} delai={i * 150} className="relative pl-14">
                <span
                  className="absolute left-0 top-0 w-10 h-10 rounded-full border-2 border-primary text-primary font-bold flex items-center justify-center"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <h3 className="flex items-center gap-2v font-bold mb-1v">
                  <Icone size={18} className="text-primary" aria-hidden="true" />
                  <span>
                    <span className="sr-only">Étape {i + 1} : </span>
                    {titre}
                  </span>
                </h3>
                <p className="text-sm text-text-secondary">{texte}</p>
              </Apparition>
            ))}
          </ol>
          <Apparition delai={200}>
            <CTADecouverte />
          </Apparition>
        </div>
      </section>

      {/* Domaines */}
      <section className="py-12v">
        <div className="bj-container">
          <TitreSection titre="Explore par domaine" marge="mb-2v" />
          <Domaines />
        </div>
      </section>

      {/* Conseiller en fongbé : texte depuis la gauche, échange depuis la droite, bulles l'une après l'autre */}
      <section className="py-12v bg-surface border-y border-border overflow-hidden">
        <div className="bj-container grid grid-cols-1 lg:grid-cols-2 gap-8v items-center">
          <Apparition effet="gauche">
            <Badge ton="info" icon={<Languages size={14} aria-hidden="true" />} className="mb-4v text-sm py-1v">
              Nouveau
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold mb-3v">Guido répond aussi en fongbé, et t&apos;écoute en note vocale</h2>
            <p className="text-text-secondary mb-3v">
              Pose tes questions sur les formations, les métiers et tes pistes. Choisis « Fɔ̀ngbè » pour une réponse dans ta langue, ou
              parle-lui directement en note vocale — en fon, en yoruba, en mina — s&apos;écrire n&apos;est pas toujours facile, dire les
              choses l&apos;est davantage.
            </p>
            <p className="text-xs text-text-secondary mb-6v">
              Réponses rédigées automatiquement. Guido explique, il ne décide pas à ta place.
            </p>
            <Link href="/conseiller" className="bj-btn bj-btn-primary">
              Poser une question
            </Link>
          </Apparition>

          <Apparition as="figure" effet="droite" delai={150} className="rounded-bj-lg border border-border bg-background p-6v space-y-3v">
            <Apparition effet="droite" delai={500} className="flex justify-end">
              <p className="bubble-user max-w-[85%] text-sm">Bonjour&nbsp;!</p>
            </Apparition>
            <Apparition effet="gauche" delai={1100} className="flex justify-start">
              <div className="bubble-assistant max-w-[85%]">
                <p lang="fon" className="text-sm font-medium">
                  A fɔ́n à, azɔ̌kplɔ́n tɛ́ a jló na bló ɖò bákì gudo&nbsp;?
                </p>
                <p className="text-xs text-text-secondary mt-1v">« Bonjour, quelle formation veux-tu faire après le bac&nbsp;? »</p>
              </div>
            </Apparition>
            <figcaption className="text-xs text-text-secondary text-center pt-2v">Exemple de réponse en fongbé, avec sa traduction</figcaption>
          </Apparition>
        </div>
      </section>

      {/* Garanties */}
      <section className="py-12v">
        <div className="bj-container">
          <h2 className="sr-only">Nos engagements</h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-8v">
            {GARANTIES.map(({ Icone, titre, texte }, i) => (
              <Apparition as="li" key={titre} delai={i * 120} className="flex gap-4v">
                <Icone size={24} className="text-primary shrink-0 mt-[2px]" aria-hidden="true" />
                <div>
                  <h3 className="font-bold mb-1v">{titre}</h3>
                  <p className="text-sm text-text-secondary">{texte}</p>
                </div>
              </Apparition>
            ))}
          </ul>
          <Apparition as="p" delai={200} className="mt-10 text-sm text-text-secondary">
            Besoin d&apos;aide&nbsp;?{' '}
            <Link href="/guide" className="font-medium text-primary hover:underline">
              Guide d&apos;utilisation
            </Link>{' '}
            ·{' '}
            <Link href="/faq" className="font-medium text-primary hover:underline">
              Questions fréquentes
            </Link>{' '}
            ·{' '}
            <Link href="/donnees-personnelles" className="font-medium text-primary hover:underline">
              Données personnelles
            </Link>
          </Apparition>
        </div>
      </section>
    </>
  );
}
