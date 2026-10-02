import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Backpack,
  BookOpen,
  Check,
  ClipboardList,
  Compass,
  HeartHandshake,
  Languages,
  Lightbulb,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { ActionsHero } from '@/components/accueil/ActionsHero';
import { ApresLeBac } from '@/components/accueil/ApresLeBac';
import { CTADecouverte } from '@/components/accueil/CTADecouverte';
import { Domaines } from '@/components/accueil/Domaines';
import { Apparition } from '@/components/animation/Apparition';

const PROFILS: { Icone: LucideIcon; numero: string; etiquette: string; titre: string; texte: string; href: string; action: string; ton: string }[] = [
  {
    Icone: Backpack,
    numero: '01',
    etiquette: 'Élève de 4e ou 3e',
    titre: 'Après le BEPC',
    texte: 'Explore les lycées généraux, techniques, agricoles et les métiers qui te ressemblent.',
    href: '/catalogue?niveau=APRES_BEPC',
    action: 'Voir les formations',
    ton: 'vert',
  },
  {
    Icone: Compass,
    numero: '02',
    etiquette: 'Élève de 1re ou Terminale',
    titre: 'Après le bac',
    texte: 'Choisis ta série, compare les formations du supérieur et prépare tes vœux sereinement.',
    href: '/catalogue?niveau=APRES_BAC',
    action: 'Explorer le supérieur',
    ton: 'nuit',
  },
  {
    Icone: Users,
    numero: '03',
    etiquette: 'Parent ou tuteur',
    titre: 'À ses côtés',
    texte: 'Suis les résultats, valide les vœux et pose à Guido tes questions sur les métiers techniques.',
    href: '/guide#parent',
    action: 'Découvrir l’espace famille',
    ton: 'sable',
  },
];

const ETAPES: { Icone: LucideIcon; titre: string; texte: string }[] = [
  { Icone: Sparkles, titre: 'Réponds', texte: "Un questionnaire de quelques minutes pour faire émerger ce qui te motive." },
  { Icone: Search, titre: 'Explore', texte: 'Parcours le catalogue, compare les formations et garde tes préférées.' },
  { Icone: Lightbulb, titre: 'Découvre', texte: 'Reçois des pistes expliquées simplement, selon tes envies et tes résultats.' },
  { Icone: ClipboardList, titre: 'Décide', texte: 'Prépare tes vœux et échange avec ta famille avant de te lancer.' },
];

const GARANTIES: { Icone: LucideIcon; titre: string; texte: string; lien: string; href: string; ton: string }[] = [
  { Icone: BookOpen, titre: 'Des informations sourcées', texte: 'Chaque fiche cite ses sources. Tant qu’une information n’est pas validée, elle est clairement signalée.', lien: 'Comprendre les sources', href: '/catalogue', ton: 'vert' },
  { Icone: HeartHandshake, titre: 'La plateforme propose, tu décides', texte: 'Chaque piste est expliquée critère par critère. La décision revient à l’élève et à sa famille.', lien: 'Voir notre méthode', href: '/guide', ton: 'corail' },
  { Icone: Lock, titre: 'Un dossier protégé', texte: 'Seuls l’élève, son parent rattaché et les administrateurs habilités voient le dossier scolaire.', lien: 'En savoir plus', href: '/donnees-personnelles', ton: 'bleu' },
];

function Kicker({ children, clair = false }: { children: React.ReactNode; clair?: boolean }) {
  return <span className={`mo-kicker${clair ? ' mo-kicker-light' : ''}`}>{children}</span>;
}

export default function Accueil() {
  return (
    <div className="mo-home">
      <section className="mo-hero">
        <div className="mo-container mo-hero-grid">
          <div className="mo-hero-copy">
            <Apparition as="p" className="mo-eyebrow"><Sparkles size={14} aria-hidden="true" /> Ton avenir commence par une question</Apparition>
            <Apparition as="h1" delai={80}>Choisis un chemin qui <em>te ressemble.</em></Apparition>
            <Apparition as="p" delai={160} className="mo-hero-lede">De la 4e à la Terminale, explore les formations, comprends tes possibilités et avance avec ta famille.</Apparition>
            <Apparition delai={240}>
              <form action="/catalogue" role="search" className="mo-search">
                <label htmlFor="recherche-accueil" className="sr-only">Rechercher une formation, un métier ou une ville</label>
                <Search size={20} aria-hidden="true" />
                <input id="recherche-accueil" name="q" type="search" placeholder="Une formation, un métier, une ville…" />
                <button type="submit">Rechercher <ArrowRight size={16} aria-hidden="true" /></button>
              </form>
              <Link href="/catalogue" className="mo-browse-link">ou parcourir tout le catalogue <ArrowRight size={15} aria-hidden="true" /></Link>
            </Apparition>
            <Apparition delai={320} className="mo-hero-actions"><ActionsHero /></Apparition>
            <div className="mo-hero-note"><ShieldCheck size={16} aria-hidden="true" /> Informations sourcées, données protégées, décision à toi.</div>
          </div>

          <Apparition effet="droite" delai={180} className="mo-hero-visual">
            <div className="mo-hero-image"><img src="/images/hero-orientation.webp" alt="Trois élèves échangent dans la cour de leur établissement" /><span className="mo-hero-image-wash" /></div>
            <div className="mo-hero-sticker"><strong>5 min</strong><span>pour faire le point<br />sur tes envies</span></div>
            <div className="mo-hero-proof"><span><Check size={16} /></span><div><strong>Des pistes qui ont du sens</strong><small>expliquées selon ton profil</small></div></div>
            <div className="mo-hero-bac"><ApresLeBac /></div>
            <span className="mo-hero-star" aria-hidden="true">✳</span>
          </Apparition>
        </div>
      </section>

      <div className="mo-proof-strip" aria-label="Repères de la plateforme">
        <div><strong>De la 4e au supérieur</strong><span>Une continuité pour chaque étape</span></div>
        <div><strong>+100 formations</strong><span>À découvrir dans le catalogue</span></div>
        <div><strong>En famille</strong><span>Pour décider sans pression</span></div>
        <div><strong>Questions en français</strong><span>Pour mieux se comprendre</span></div>
      </div>

      <section className="mo-section" id="depart">
        <div className="mo-container">
          <div className="mo-section-heading mo-section-heading-split">
            <div><Kicker>Par où commencer ?</Kicker><h2>Le bon point de départ,<br /><em>selon ton histoire.</em></h2></div>
            <p>Pas besoin de tout savoir aujourd’hui. Choisis simplement l’étape qui te concerne, et avance une question à la fois.</p>
          </div>
          <ul className="mo-profile-grid">
            {PROFILS.map(({ Icone, numero, etiquette, titre, texte, href, action, ton }, i) => (
              <Apparition as="li" key={titre} delai={i * 120}>
                <Link href={href} className={`mo-profile-card mo-profile-${ton}`}>
                  <div className="mo-profile-top"><span>{numero}</span><Icone size={22} aria-hidden="true" /></div>
                  <span className="mo-profile-label">{etiquette}</span>
                  <h3>{titre}</h3>
                  <p>{texte}</p>
                  <span className="mo-card-link">{action} <ArrowUpRight size={16} aria-hidden="true" /></span>
                </Link>
              </Apparition>
            ))}
          </ul>
        </div>
      </section>

      <section className="mo-catalogue-section" id="catalogue">
        <div className="mo-container">
          <div className="mo-section-heading mo-section-heading-split">
            <div><Kicker>Le catalogue en un coup d’œil</Kicker><h2>Des domaines pour<br /><em>ouvrir le champ.</em></h2></div>
            <div><p>Chaque domaine rassemble des formations, des métiers et des chemins différents. Commence par ce qui t’attire.</p><Link href="/catalogue" className="mo-browse-link">Voir tout le catalogue <ArrowRight size={15} aria-hidden="true" /></Link></div>
          </div>
          <Domaines />
        </div>
      </section>

      <section className="mo-process" id="parcours">
        <div className="mo-container mo-process-grid">
          <div className="mo-process-intro"><Kicker clair>Un chemin simple</Kicker><h2>Tu n’as pas à choisir<br /><em>tout seul.</em></h2><p>Mon Orientation t’aide à mettre des mots sur tes envies, puis à transformer ces envies en options concrètes.</p><CTADecouverte /></div>
          <ol className="mo-step-list">
            {ETAPES.map(({ Icone, titre, texte }, i) => <li key={titre}><span className="mo-step-number">0{i + 1}</span><div><h3><Icone size={16} aria-hidden="true" />{titre}</h3><p>{texte}</p></div><ArrowUpRight size={16} aria-hidden="true" /></li>)}
          </ol>
        </div>
      </section>

      <section className="mo-guido-section" id="guido">
        <div className="mo-container mo-guido-grid">
          <div className="mo-guido-copy"><Kicker>Une question ? Écris à Guido.</Kicker><h2>Parfois, il suffit de<br /><em>pouvoir demander.</em></h2><p>Guido répond en français à tes questions générales sur les métiers et les formations techniques. Il ne consulte pas ton dossier scolaire.</p><p className="mo-disclaimer">Réponses automatiques : vérifie les informations importantes auprès de l’établissement.</p><Link href="/conseiller" className="mo-button mo-button-primary">Poser une question <ArrowRight size={16} aria-hidden="true" /></Link></div>
          <figure className="mo-chat-card"><div className="mo-chat-top"><span className="mo-guido-avatar">G</span><div><strong>Guido</strong><small>Guide des métiers techniques</small></div><span className="mo-online" /></div><div className="mo-bubble mo-bubble-bot">Bonjour ! Quels métiers techniques aimerais-tu découvrir ?</div><div className="mo-bubble mo-bubble-user">J’aime comprendre comment les choses fonctionnent.</div><div className="mo-chat-chips"><span>Technologie</span><span>Industrie</span><span>Autre idée</span></div><figcaption>Exemple de question écrite en français</figcaption></figure>
        </div>
      </section>

      <section className="mo-section mo-trust-section" id="engagements">
        <div className="mo-container">
          <div className="mo-section-heading mo-section-heading-split"><div><Kicker>Nos engagements</Kicker><h2>Un service public pour<br /><em>avancer en confiance.</em></h2></div><p>Ton avenir mérite des informations claires, des choix expliqués et un espace qui respecte ta vie privée.</p></div>
          <ul className="mo-trust-grid">
            {GARANTIES.map(({ Icone, titre, texte, lien, href, ton }, i) => <Apparition as="li" key={titre} delai={i * 120} className={`mo-trust-card mo-trust-${ton}`}><span className="mo-trust-icon"><Icone size={20} aria-hidden="true" /></span><h3>{titre}</h3><p>{texte}</p><Link href={href}>{lien} <ArrowRight size={15} aria-hidden="true" /></Link></Apparition>)}
          </ul>
          <p className="mo-help-line">Besoin d&apos;aide ? <Link href="/guide">Guide d&apos;utilisation</Link> · <Link href="/faq">Questions fréquentes</Link> · <Link href="/donnees-personnelles">Données personnelles</Link></p>
        </div>
      </section>
    </div>
  );
}
