'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Compass,
  Save,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { apprenantApi } from '@/lib/api';
import { domainesDominants, type Decouverte, type Priorite, type ReponsesDecouverte, dateLisible, etiquetteProfil } from '@/lib/apprenant';
import { DOMAINE_LABELS } from '@/lib/filiere';
import {
  BANQUE_RIASEC,
  CODES_RIASEC,
  LABELS_LIKERT,
  LABELS_RIASEC,
  PHRASES_RIASEC,
  codesDominants,
  scoresRiasec,
  type ValeurLikert,
} from '@/lib/riasec';
import { messageErreur } from '@/lib/erreurs';
import { useEspace, useProfil } from '@/components/espace/EspaceContext';
import { Alerte, CHAMP, Chargement } from '@/components/espace/ui';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useDecouverteStore } from '@/stores/decouverteStore';

const MAX_PRIORITES = 3;

// 24 questions principales, réparties équitablement entre les 6 dimensions RIASEC.
// Les autres items restent connus du moteur mais sont complétés par une valeur neutre à l'envoi.
const QUESTIONS_PAR_DIMENSION = 4;
const QUESTIONS_PARCOURS = BANQUE_RIASEC.filter((_, index) => index % 6 < QUESTIONS_PAR_DIMENSION);
const NB_QUESTIONS_PARCOURS = QUESTIONS_PARCOURS.length;
/** Même ordre que construireEcrans : sert à retrouver, pour un indexEcran de brouillon repris, quels
 * écrans ont forcément déjà été passés (et donc répondus, voir `touches`). */
const CLES_ECRANS_EN_ORDRE = [
  ...QUESTIONS_PARCOURS.map((q) => `riasec-${q.id}`),
  'metier',
  'styleTravail',
  'statut',
  'dureeEtudes',
  'priorites',
  'internat',
  'mobiliteDepartement',
];

const VIDE: ReponsesDecouverte = {
  riasec: [],
  metierEnvisage: null,
  apresCollege: 'INDECIS',
  styleTravail: 'MIXTE',
  statut: 'INDECIS',
  dureeEtudes: 'PEU_IMPORTE',
  priorites: [],
  internat: 'INDECIS',
  mobiliteDepartement: 'INDECIS',
};

const LABEL_PRIORITE: Record<Priorite, string> = {
  REVENU: 'Gagner ma vie rapidement',
  UTILITE: 'Un métier qui aide les autres',
  CREATIVITE: 'Un métier créatif',
  SECURITE: "La sécurité de l'emploi",
  MOBILITE: 'Pouvoir bouger, voyager',
  PROXIMITE_FAMILLE: 'Rester près de ma famille',
};
const PRIORITES: Priorite[] = ['REVENU', 'UTILITE', 'CREATIVITE', 'SECURITE', 'MOBILITE', 'PROXIMITE_FAMILLE'];

/** Libellé court pour le récapitulatif — reprend le sens des options de la question (ligne ~340), pas leur
 * texte long : la carte du récap n'a la place que pour une réponse brève. */
const LABEL_STYLE_TRAVAIL: Record<ReponsesDecouverte['styleTravail'], string> = {
  MANUEL: 'Manuel, sur le terrain',
  INTELLECTUEL: 'Intellectuel, réflexif',
  MIXTE: 'Un peu des deux',
};

/** 5 chapitres, affichés dans l'en-tête de progression — au-dessus des questions posées une à une. */
const CHAPITRES = [
  { titre: 'Ce qui te plaît', sousTitre: 'Prends ton temps : il n’y a pas de bonne ou de mauvaise réponse.' },
  { titre: 'Encore ce qui te plaît', sousTitre: 'On continue tranquillement avec ce qui t’attire au quotidien.' },
  { titre: 'Ce que tu envisages', sousTitre: 'Même une idée qui change peut nous aider à mieux t’accompagner.' },
  { titre: 'Tes ambitions', sousTitre: 'Imagine le travail et la vie professionnelle qui te correspondraient.' },
  { titre: 'Tes contraintes pratiques', sousTitre: 'Ces réponses nous aident à te proposer des parcours réalistes et accessibles.' },
] as const;

export default function DecouvertePage() {
  const profil = useProfil();
  const { estEleve } = useEspace();
  const [decouverte, setDecouverte] = useState<Decouverte | null | undefined>(undefined);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    setDecouverte(undefined);
    apprenantApi
      .getDecouverte(profil.nip)
      .then(({ data }) => {
        if (!annule) setDecouverte(data);
      })
      .catch((err) => {
        if (!annule) setErreur(messageErreur(err));
      });
    return () => {
      annule = true;
    };
  }, [profil.nip]);

  if (erreur) return <Alerte ton="erreur">{erreur}</Alerte>;
  if (decouverte === undefined) return <Chargement />;
  if (!estEleve) return <DecouverteEnLecture prenom={profil.prenom} decouverte={decouverte} />;
  return <Questionnaire decouverteActuelle={decouverte} onEnregistre={setDecouverte} />;
}

function DecouverteEnLecture({ prenom, decouverte }: { prenom: string; decouverte: Decouverte | null }) {
  if (!decouverte) {
    return <Alerte ton="info">{prenom} n&apos;a pas encore rempli le questionnaire de découverte.</Alerte>;
  }
  const r = decouverte.reponses;
  return (
    <section className="bg-surface rounded-bj-md border border-border p-6v space-y-4v">
      <h2 className="text-xl font-bold">Ce que {prenom} a dit de lui-même</h2>
      <ResultatProfil decouverte={decouverte} />
      {r.metierEnvisage && (
        <p>
          <span className="text-text-secondary">Métier envisagé : </span>« {r.metierEnvisage} »
        </p>
      )}
      <p className="text-xs text-text-secondary">Rempli le {dateLisible(decouverte.dateSaisie)}.</p>
    </section>
  );
}

/** Résultat du test : barres par dimension RIASEC, phrase du/des code(s) dominant(s), actions rapides. */
function ResultatProfil({ decouverte }: { decouverte: Decouverte }) {
  const scores = scoresRiasec(decouverte.reponses.riasec);
  const dominants = codesDominants(scores);
  return (
    <div className="bg-primary/5 border border-primary/30 rounded-bj-md p-4v space-y-4v">
      <div>
        <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1v">Ton profil</p>
        <p className="text-sm">{etiquetteProfil(decouverte)}</p>
      </div>
      <div className="space-y-2v">
        {CODES_RIASEC.map((code) => (
          <div key={code} className="flex items-center gap-3v">
            <span className="w-32 text-xs text-text-secondary shrink-0">{LABELS_RIASEC[code]}</span>
            <ProgressBar className="flex-1" value={scores[code] * 100} label={LABELS_RIASEC[code]} />
          </div>
        ))}
      </div>
      {dominants.length > 0 && (
        <p className="text-sm text-text-secondary">
          {dominants.map((c) => PHRASES_RIASEC[c]).join(' ; ')}.
        </p>
      )}
      <div className="flex flex-wrap gap-3v pt-1v">
        <ButtonLink href="/catalogue" variant="secondary" size="sm">
          Explorer le catalogue
        </ButtonLink>
        <ButtonLink href="/espace-apprenant/recommandations" variant="secondary" size="sm">
          Voir mes pistes
        </ButtonLink>
        <ButtonLink href="/espace-apprenant/conseiller" variant="secondary" size="sm">
          Parler à Guido
        </ButtonLink>
      </div>
    </div>
  );
}

/** Étiquette de sélection — une réponse-carte, jamais juste une couleur : coche visible dès qu'elle est choisie. */
function Etiquette({
  selectionne,
  onClick,
  ariaLabel,
  pleineLargeur,
  children,
}: {
  selectionne: boolean;
  onClick: () => void;
  ariaLabel?: string;
  pleineLargeur?: boolean;
  children: ReactNode;
}) {
  // Rebond uniquement au moment où l'option VIENT d'être cochée — pas à chaque fois qu'on retombe sur une
  // question déjà répondue (bouton « précédent »), ce qui rejouerait l'animation sans raison.
  const [rebond, setRebond] = useState(false);
  const gererClic = () => {
    if (!selectionne) setRebond(true);
    onClick();
  };
  return (
    <button
      type="button"
      aria-pressed={selectionne}
      aria-label={ariaLabel}
      onClick={gererClic}
      className={`flex items-center gap-3v rounded-bj-md border px-4v py-3v text-sm font-medium text-left transition-all active:scale-[0.99] ${
        pleineLargeur ? 'w-full' : ''
      } ${
        selectionne
          ? 'border-primary bg-primary-soft text-text shadow-[0_2px_10px_rgba(0,135,81,0.12)]'
          : 'border-border-strong bg-surface text-text hover:border-primary hover:bg-primary-soft/40'
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selectionne ? 'border-primary bg-primary text-white' : 'border-border-strong bg-surface'
        } ${rebond ? 'pop-feedback' : ''}`}
        aria-hidden="true"
        onAnimationEnd={() => setRebond(false)}
      >
        {selectionne && <Check size={13} strokeWidth={3} />}
      </span>
      <span className="flex-1">{children}</span>
    </button>
  );
}

function ChoixUnique<T extends string>({
  options,
  labels,
  valeur,
  onChange,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  valeur: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid gap-2v" role="radiogroup">
      {options.map((o) => (
        <Etiquette key={o} selectionne={valeur === o} onClick={() => onChange(o)} pleineLargeur>
          {labels[o]}
        </Etiquette>
      ))}
    </div>
  );
}

/** En toutes lettres plutôt qu'en chiffre, plus naturel pour une petite quantité (« Trois choix max possibles »). */
const MOTS_NOMBRE: Record<number, string> = { 1: 'Un', 2: 'Deux', 3: 'Trois', 4: 'Quatre', 5: 'Cinq', 6: 'Six' };

function ChoixMultiple<T extends string>({
  options,
  labels,
  valeurs,
  onChange,
  max,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  valeurs: T[];
  onChange: (v: T[]) => void;
  max: number;
}) {
  const basculer = (o: T) => {
    if (valeurs.includes(o)) onChange(valeurs.filter((v) => v !== o));
    else if (valeurs.length < max) onChange([...valeurs, o]);
  };
  return (
    <div>
      <p className="text-sm text-text-secondary mb-3v -mt-2v text-center">({MOTS_NOMBRE[max] ?? max} choix max possibles)</p>
      <div className="grid gap-2v">
        {options.map((o) => (
          <Etiquette key={o} selectionne={valeurs.includes(o)} onClick={() => basculer(o)} pleineLargeur>
            {labels[o]}
          </Etiquette>
        ))}
      </div>
      <p className="text-xs text-text-secondary mt-3v">
        {valeurs.length}/{max} choisi{valeurs.length > 1 ? 's' : ''}.
      </p>
    </div>
  );
}

/** Échelle 1 (pas du tout) à 10 (tout à fait) — le chiffre et son sens toujours ensemble, jamais un chiffre seul : ça évite l'air de barème noté. */
const VALEURS_LIKERT: ValeurLikert[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function EchelleLikert({ valeur, onChange }: { valeur: ValeurLikert | undefined; onChange: (v: ValeurLikert) => void }) {
  return (
    <div className="grid gap-2v" role="radiogroup">
      {VALEURS_LIKERT.map((v) => (
        <Etiquette key={v} selectionne={valeur === v} onClick={() => onChange(v)} pleineLargeur>
          <span className="font-bold text-primary mr-2v">{v}</span>
          {LABELS_LIKERT[v]}
        </Etiquette>
      ))}
    </div>
  );
}

/** Une question à la fois, dans une zone centrale unique — remplace l'ancienne liste de 12 questions empilées. */
type EcranQuestion = { chapitre: number; cle: string; titre: string; contenu: ReactNode };

function construireEcrans(
  r: ReponsesDecouverte,
  maj: <K extends keyof ReponsesDecouverte>(champ: K, valeur: ReponsesDecouverte[K]) => void,
  definirRiasec: (id: string, valeur: ValeurLikert) => void,
  surEnterMetier: () => void,
): EcranQuestion[] {
  const riasecEcrans: EcranQuestion[] = QUESTIONS_PARCOURS.map((q, i) => ({
    chapitre: i < 12 ? 1 : 2,
    cle: `riasec-${q.id}`,
    titre: q.texte,
    contenu: (
      <div data-id-question={q.id}>
        <EchelleLikert valeur={r.riasec.find((x) => x.id === q.id)?.valeur} onChange={(v) => definirRiasec(q.id, v)} />
      </div>
    ),
  }));

  return [
    ...riasecEcrans,
    {
      chapitre: 3,
      cle: 'metier',
      titre: 'As-tu une idée du métier que tu voudrais faire plus tard ?',
      contenu: (
        <>
          <label htmlFor="metier-envisage" className="sr-only">
            Métier envisagé
          </label>
          <input
            id="metier-envisage"
            type="text"
            maxLength={200}
            value={r.metierEnvisage ?? ''}
            onChange={(e) => maj('metierEnvisage', e.target.value || null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                surEnterMetier();
              }
            }}
            placeholder="Facultatif : le métier auquel tu penses, même si ce n'est pas encore sûr"
            className={CHAMP}
          />
        </>
      ),
    },
    {
      chapitre: 3,
      cle: 'styleTravail',
      titre: 'Tu préférerais plutôt…',
      contenu: (
        <ChoixUnique
          options={['MANUEL', 'INTELLECTUEL', 'MIXTE'] as const}
          labels={{ MANUEL: 'Travailler avec tes mains, sur le terrain', INTELLECTUEL: 'Travailler avec des idées, des chiffres ou des mots', MIXTE: 'Un peu des deux' }}
          valeur={r.styleTravail}
          onChange={(v) => maj('styleTravail', v)}
        />
      ),
    },
    {
      chapitre: 4,
      cle: 'statut',
      titre: 'Plus tard, tu aimerais plutôt…',
      contenu: (
        <ChoixUnique
          options={['SALARIE', 'ENTREPRENEUR', 'LES_DEUX', 'INDECIS'] as const}
          labels={{ SALARIE: 'Être salarié(e) dans une entreprise ou une administration', ENTREPRENEUR: 'Créer ta propre activité', LES_DEUX: 'Les deux, ça dépendra', INDECIS: 'Je ne sais pas encore' }}
          valeur={r.statut}
          onChange={(v) => maj('statut', v)}
        />
      ),
    },
    {
      chapitre: 4,
      cle: 'dureeEtudes',
      titre: 'Tu préférerais…',
      contenu: (
        <ChoixUnique
          options={['COURTE', 'LONGUE', 'PEU_IMPORTE'] as const}
          labels={{ COURTE: 'Une formation courte pour travailler vite', LONGUE: 'Des études plus longues', PEU_IMPORTE: 'Peu importe, si le métier me plaît' }}
          valeur={r.dureeEtudes}
          onChange={(v) => maj('dureeEtudes', v)}
        />
      ),
    },
    {
      chapitre: 4,
      cle: 'priorites',
      titre: 'Ce qui compte le plus pour toi dans un métier',
      contenu: <ChoixMultiple options={PRIORITES} labels={LABEL_PRIORITE} valeurs={r.priorites} onChange={(v) => maj('priorites', v)} max={MAX_PRIORITES} />,
    },
    {
      chapitre: 5,
      cle: 'internat',
      titre: 'Partir en internat, loin de chez toi, ça te conviendrait ?',
      contenu: (
        <ChoixUnique
          options={['OUI', 'NON', 'INDECIS'] as const}
          labels={{ OUI: 'Oui', NON: 'Non', INDECIS: 'Je ne sais pas encore' }}
          valeur={r.internat}
          onChange={(v) => maj('internat', v)}
        />
      ),
    },
    {
      chapitre: 5,
      cle: 'mobiliteDepartement',
      titre: "Es-tu prêt(e) à te former dans un autre département si la formation qui te plaît n'existe pas près de chez toi ?",
      contenu: (
        <ChoixUnique
          options={['OUI', 'NON', 'INDECIS'] as const}
          labels={{ OUI: 'Oui', NON: 'Non', INDECIS: 'Je ne sais pas encore' }}
          valeur={r.mobiliteDepartement}
          onChange={(v) => maj('mobiliteDepartement', v)}
        />
      ),
    },
  ];
}

/** Écran d'accueil du questionnaire : ce qui manquait pour ne pas enchaîner directement sur des questions. */
function IntroQuestionnaire({ reprise, onCommencer }: { reprise: boolean; onCommencer: () => void }) {
  return (
    <div className="px-5v py-10v md:px-10v md:py-14v text-center max-w-xl mx-auto">
      <span className="inline-flex w-14 h-14 rounded-full bg-primary-soft text-primary items-center justify-center mb-5v" aria-hidden="true">
        <Compass size={26} />
      </span>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-2v">{reprise ? 'Tu peux reprendre où tu t’étais arrêté(e)' : 'Ton parcours commence ici'}</p>
      <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3v">Apprenons à mieux te connaître</h2>
      <p className="text-text-secondary mb-6v">
        Quelques questions sur ce qui te plaît, tes envies et ta situation — pour te proposer des formations qui te correspondent vraiment.
        Il n&apos;y a pas de bonne ou de mauvaise réponse, et tu pourras toujours changer d&apos;avis plus tard.
      </p>
      <div className="inline-flex items-center gap-2v rounded-full border border-border bg-background px-4v py-2v text-sm text-text-secondary mb-8v">
        <Clock3 size={16} className="text-primary" aria-hidden="true" />
        5 à 8 minutes, à ton rythme
      </div>
      <div>
        <Button size="lg" iconRight={<ArrowRight size={18} aria-hidden="true" />} onClick={onCommencer}>
          {reprise ? 'Continuer' : 'Commencer'}
        </Button>
      </div>
    </div>
  );
}

function RecapitulatifPreEnvoi({ reponses }: { reponses: ReponsesDecouverte }) {
  const valeur = (texte: string | null | undefined, remplacement: string) => texte || remplacement;
  const scores = scoresRiasec(reponses.riasec);
  const dominants = codesDominants(scores).map((code) => LABELS_RIASEC[code]);
  const lectureTravail =
    reponses.styleTravail === 'MANUEL'
      ? 'concret, pratique et sur le terrain'
      : reponses.styleTravail === 'INTELLECTUEL'
        ? 'réflexif, avec des idées, des chiffres ou des mots'
        : 'varié, avec un peu de pratique et de réflexion';
  return (
    <div className="space-y-5v">
      <div className="rounded-bj-sm border border-primary/30 bg-primary/5 p-4v md:p-5v">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2v">Première lecture de ton profil</p>
        <p className="font-semibold">
          {dominants.length
            ? `Tu sembles particulièrement attiré(e) par les activités liées au profil ${dominants.join(' et ')}.`
            : 'Tes réponses sont assez équilibrées : aucun profil ne se détache nettement pour l’instant, et ce n’est pas un problème.'}
        </p>
        <p className="text-sm text-text-secondary mt-1v">
          Tu pourrais apprécier un environnement de travail {lectureTravail}. Ces premières indications serviront à classer les formations
          techniques à explorer.
        </p>
      </div>
      <div className="grid gap-3v md:grid-cols-2">
        <div className="rounded-bj-sm border border-border bg-background p-4v">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1v">Tes intérêts</p>
          <p className="font-semibold">Profil construit à partir de {NB_QUESTIONS_PARCOURS} questions</p>
        </div>
        <div className="rounded-bj-sm border border-border bg-background p-4v">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1v">Métier envisagé</p>
          <p className="font-semibold">{valeur(reponses.metierEnvisage, 'Je suis encore en réflexion')}</p>
        </div>
        <div className="rounded-bj-sm border border-border bg-background p-4v">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1v">Ta façon de travailler</p>
          <p className="font-semibold">{LABEL_STYLE_TRAVAIL[reponses.styleTravail]}</p>
        </div>
        <div className="rounded-bj-sm border border-border bg-background p-4v">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1v">Ce qui compte pour toi</p>
          <p className="font-semibold">{reponses.priorites.length ? reponses.priorites.map((p) => LABEL_PRIORITE[p]).join(' · ') : 'Pas encore défini'}</p>
        </div>
      </div>
      <div className="rounded-bj-sm border-l-4 border-primary bg-primary/5 p-4v text-sm">
        Tu pourras modifier tes réponses plus tard. Elles servent à personnaliser ton accompagnement, pas à prendre une décision à ta place.
      </div>
    </div>
  );
}

/**
 * Écran affiché juste après l'enregistrement, uniquement au tout premier remplissage : avant, la page
 * enregistrait puis redirigeait aussitôt vers le tableau de bord sans jamais montrer de résultat.
 * S'appuie sur les données renvoyées par le serveur (affinités par domaine réellement calculées),
 * pas sur une ré-estimation côté client.
 */
function ConfirmationFinale({ decouverte, onContinuer }: { decouverte: Decouverte; onContinuer: () => void }) {
  const scores = scoresRiasec(decouverte.reponses.riasec);
  const dominants = codesDominants(scores);
  const domaines = domainesDominants(decouverte.affinites).map((d) => DOMAINE_LABELS[d]);
  return (
    <div className="px-5v py-8v md:px-10v md:py-10v max-w-2xl mx-auto text-center">
      <span className="inline-flex w-14 h-14 rounded-full bg-success text-text-on-primary items-center justify-center mb-5v" aria-hidden="true">
        <Sparkles size={26} />
      </span>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-success mb-2v">Profil enregistré</p>
      <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3v">Merci, ton profil est prêt</h2>
      <p className="text-text-secondary mb-6v">Voici une première lecture — à affiner au fil de tes découvertes, pas une décision figée.</p>

      <div className="grid gap-4v sm:grid-cols-2 text-left mb-6v">
        <div className="rounded-bj-md border border-border bg-surface p-4v">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2v">Tendances principales</p>
          {dominants.length > 0 ? (
            <p className="text-sm">{dominants.map((c) => `${LABELS_RIASEC[c]} — ${PHRASES_RIASEC[c]}`).join(' · ')}</p>
          ) : (
            <p className="text-sm text-text-secondary">Encore à préciser au fil de tes réponses futures.</p>
          )}
        </div>
        <div className="rounded-bj-md border border-border bg-surface p-4v">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2v">Domaines d’intérêt</p>
          {domaines.length > 0 ? (
            <p className="text-sm">{domaines.join(' et ')}</p>
          ) : (
            <p className="text-sm text-text-secondary">Rien de net ne se dégage encore, et c’est normal à ce stade.</p>
          )}
        </div>
      </div>

      <div className="rounded-bj-sm border border-primary/30 bg-primary-soft p-4v text-left mb-6v">
        <p className="text-sm font-semibold mb-1v">Des pistes possibles à explorer</p>
        <p className="text-sm text-text-secondary">
          {domaines.length > 0
            ? `Des formations techniques en ${domaines.join(' et ')} pourraient te plaire. `
            : 'Le catalogue reste ouvert à explorer librement. '}
          Ce ne sont que des pistes de départ : regarde-les avec ta famille avant de te décider.
        </p>
      </div>

      <p className="text-xs text-text-muted mb-8v">
        Ce résultat aide à explorer les formations qui pourraient te correspondre — il ne remplace ni ton avis, ni celui de ta famille, et ne
        décide rien à ta place.
      </p>

      <Button size="lg" iconRight={<ArrowRight size={18} aria-hidden="true" />} onClick={onContinuer}>
        Accéder à mon tableau de bord
      </Button>
    </div>
  );
}

function Questionnaire({
  decouverteActuelle,
  onEnregistre,
}: {
  decouverteActuelle: Decouverte | null;
  onEnregistre: (decouverte: Decouverte) => void;
}) {
  const router = useRouter();
  const profil = useProfil();
  const reponsesActuelles = decouverteActuelle?.reponses ?? null;
  const [r, setR] = useState<ReponsesDecouverte>(reponsesActuelles ?? VIDE);
  const [indexEcran, setIndexEcran] = useState(0);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const [decouverteEnregistree, setDecouverteEnregistree] = useState<Decouverte | null>(decouverteActuelle);
  const [modifier, setModifier] = useState(!reponsesActuelles);
  const [brouillonCharge, setBrouillonCharge] = useState(!!reponsesActuelles);
  const [demarre, setDemarre] = useState(!!reponsesActuelles);
  const [reprise, setReprise] = useState(false);
  const [afficherSauvegarde, setAfficherSauvegarde] = useState(false);
  const [confirmationFinale, setConfirmationFinale] = useState<Decouverte | null>(null);
  const zoneQuestionRef = useRef<HTMLDivElement>(null);
  const derniereNavigationRef = useRef(0);
  // Un profil déjà soumis (reponsesActuelles) est entièrement répondu par construction — rien à
  // forcer de nouveau en mode « Modifier mes réponses ». Pour un démarrage à vide, rempli au fil de
  // l'eau par `maj`/`definirRiasec` (plusieurs champs, ex. styleTravail, partent d'une valeur par
  // défaut dans VIDE plutôt que d'un état vide : sans ce suivi, « Suivant » la laisserait filer comme
  // si elle avait été choisie) ; mis à jour aussi à la reprise d'un brouillon local, ci-dessous.
  const [touches, setTouches] = useState<Set<string>>(
    () => new Set(reponsesActuelles ? CLES_ECRANS_EN_ORDRE : []),
  );

  const cleBrouillon = `mon-orientation:onboarding:${profil.nip}`;

  // Charge le brouillon local (réponses + position) — tolère l'ancien format (juste les réponses, sans
  // position) enregistré avant cette refonte, pour ne jamais perdre un brouillon existant.
  useEffect(() => {
    if (reponsesActuelles || typeof window === 'undefined') {
      setBrouillonCharge(true);
      return;
    }
    try {
      const brut = window.localStorage.getItem(cleBrouillon);
      if (brut) {
        const parse = JSON.parse(brut) as { reponses?: ReponsesDecouverte; indexEcran?: number } | ReponsesDecouverte;
        if ('reponses' in parse && parse.reponses) {
          setR(parse.reponses);
          setTouches(new Set(parse.reponses.riasec.map((x) => `riasec-${x.id}`)));
          if (typeof parse.indexEcran === 'number' && parse.indexEcran > 0) {
            setIndexEcran(parse.indexEcran);
            setDemarre(true);
            setReprise(true);
            // Les écrans avant la position reprise ont forcément déjà été passés (et donc répondus,
            // sans quoi « Suivant » ne les aurait pas laissés avancer) — y compris les champs à valeur
            // par défaut (styleTravail, statut…) que `touches` ne peut pas déduire de leur simple valeur.
            setTouches((actuel) => new Set([...Array.from(actuel), ...CLES_ECRANS_EN_ORDRE.slice(0, parse.indexEcran)]));
          }
        } else {
          setR(parse as ReponsesDecouverte);
        }
      }
    } catch {
      // Un brouillon local corrompu ne doit jamais empêcher l'accès au questionnaire.
    } finally {
      setBrouillonCharge(true);
    }
  }, [cleBrouillon, reponsesActuelles]);

  useEffect(() => {
    if (!brouillonCharge || !modifier || typeof window === 'undefined') return;
    const minuterie = window.setTimeout(() => {
      window.localStorage.setItem(cleBrouillon, JSON.stringify({ reponses: r, indexEcran }));
      setAfficherSauvegarde(true);
      window.setTimeout(() => setAfficherSauvegarde(false), 2000);
    }, 250);
    return () => window.clearTimeout(minuterie);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brouillonCharge, cleBrouillon, modifier, r, indexEcran]);

  const maj = <K extends keyof ReponsesDecouverte>(champ: K, valeur: ReponsesDecouverte[K]) => {
    setR((actuel) => ({ ...actuel, [champ]: valeur }));
    setTouches((actuel) => (actuel.has(champ) ? actuel : new Set(actuel).add(champ)));
  };

  // Mutateur fonctionnel (pas juste `maj('riasec', [...r.riasec, ...])`) : plusieurs réponses
  // peuvent être enregistrées dans la même rafale d'évènements (ex. remplissage automatisé des
  // tests) sans attendre un nouveau rendu entre chaque clic — une fermeture sur `r.riasec` figée au
  // rendu précédent ferait perdre toutes les réponses sauf la dernière.
  const definirRiasec = (id: string, valeur: ValeurLikert) => {
    setR((actuel) => ({ ...actuel, riasec: [...actuel.riasec.filter((x) => x.id !== id), { id, valeur }] }));
    setTouches((actuel) => (actuel.has(`riasec-${id}`) ? actuel : new Set(actuel).add(`riasec-${id}`)));
  };

  // Empêche qu'un double clic (ou un Entrée suivi d'un clic accidentel) ne saute deux questions d'un coup.
  const allerA = (cible: number) => {
    const maintenant = Date.now();
    if (maintenant - derniereNavigationRef.current < 300) return;
    derniereNavigationRef.current = maintenant;
    setIndexEcran(Math.max(0, cible));
  };

  const ecrans = construireEcrans(r, maj, definirRiasec, () => allerA(indexEcran + 1));
  const NB_ECRANS = ecrans.length;
  const surRecap = indexEcran >= NB_ECRANS;
  const chapitreCourant = surRecap ? 5 : ecrans[indexEcran].chapitre;
  // Seul l'écran du métier envisagé est facultatif (texte libre, « je ne sais pas encore » étant déjà
  // une réponse honnête qu'on ne force pas) — tous les autres doivent être explicitement cochés.
  const ecranRepondu = surRecap || ecrans[indexEcran].cle === 'metier' || touches.has(ecrans[indexEcran].cle);

  // Remonte en haut et replace le focus sur la nouvelle question à chaque changement — utile au clavier
  // et aux lecteurs d'écran, qui doivent retrouver le contexte sans avoir à chercher sur la page.
  useEffect(() => {
    if (!demarre) return;
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    const focalise = window.setTimeout(() => zoneQuestionRef.current?.focus(), 50);
    return () => window.clearTimeout(focalise);
  }, [indexEcran, demarre]);

  const enregistrer = async () => {
    setEnvoi(true);
    setErreur(null);
    try {
      const { data } = await apprenantApi.enregistrerDecouverte(profil.nip, r);
      onEnregistre(data);
      // Lève le mur immédiatement : sans ça, il continuerait de rediriger vers cette page en se
      // basant sur l'état chargé avant la soumission (décision du 18/09).
      useDecouverteStore.getState().definir(data);
      setDecouverteEnregistree(data);
      setEnregistre(true);
      window.localStorage.removeItem(cleBrouillon);
      if (!reponsesActuelles) {
        // 1er remplissage : un résultat avant le tableau de bord plutôt qu'une redirection immédiate.
        setConfirmationFinale(data);
      } else {
        setModifier(false);
      }
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  if (confirmationFinale) {
    return (
      <section className="bg-surface rounded-bj-md border border-border shadow-sm">
        <ConfirmationFinale decouverte={confirmationFinale} onContinuer={() => router.replace('/espace-apprenant')} />
      </section>
    );
  }

  return (
    <div className="space-y-6v">
      {decouverteEnregistree && !modifier && (
        <section className="bg-surface rounded-bj-md border border-border p-6v">
          <div className="flex items-center justify-between mb-4v">
            <h2 className="text-xl font-bold">Ton profil d&apos;intérêts</h2>
            <button
              type="button"
              onClick={() => {
                setEnregistre(false);
                setModifier(true);
              }}
              className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1v"
            >
              Modifier mes réponses <ChevronDown size={16} aria-hidden="true" />
            </button>
          </div>
          {enregistre && <Alerte ton="succes">Réponses enregistrées.</Alerte>}
          <ResultatProfil decouverte={decouverteEnregistree} />
        </section>
      )}

      {(modifier || !decouverteEnregistree) && (
        // Pas de overflow-hidden ici : combiné à position:sticky sur le bandeau de progression plus bas, ça
        // cassait le calcul de sa place réservée dans le flux normal (chevauchement mesuré avec le texte de
        // la question). Les coins arrondis sont posés directement sur les enfants concernés à la place.
        <section className="bg-surface rounded-bj-md border border-border shadow-sm">
          {!demarre ? (
            <IntroQuestionnaire reprise={reprise} onCommencer={() => setDemarre(true)} />
          ) : (
            <>
              {/* Bandeau de progression : reste visible au défilement (persistant), juste sous l'en-tête du site. */}
              {/* top-[69px] : hauteur réelle du header du site (h-16 + liseré tricolore 4px + bordure 1px), pas top-16 (64px) qui laisse un chevauchement de quelques pixels une fois collé. */}
              <div className="sticky top-[69px] z-40 rounded-t-bj-md bg-gradient-to-br from-primary-soft via-surface to-accent-soft px-5v py-5v md:px-8v md:py-6v border-b border-border">
                <div className="flex flex-wrap items-center justify-between gap-3v mb-3v">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    Chapitre {chapitreCourant}/5 · {CHAPITRES[chapitreCourant - 1].titre}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1v text-xs text-text-muted transition-opacity duration-500 ${afficherSauvegarde ? 'opacity-100' : 'opacity-0'}`}
                    role="status"
                  >
                    <Save size={12} aria-hidden="true" /> Sauvegardé
                  </span>
                </div>
                <div className="flex items-center gap-3v text-xs text-text-secondary">
                  <ProgressBar
                    className="flex-1"
                    value={(Math.min(indexEcran, NB_ECRANS) / NB_ECRANS) * 100}
                    label="Progression du questionnaire de découverte"
                  />
                  <span className="font-semibold text-primary whitespace-nowrap">
                    {surRecap ? 'Vérification' : `${indexEcran + 1}/${NB_ECRANS}`}
                  </span>
                </div>
              </div>

              <div className="px-5v py-6v md:px-8v md:py-8v bg-[#fffdfa]">
                {/* tabIndex=-1 : cible de focus programmatique après chaque changement de question, jamais atteinte au clavier par tabulation normale. */}
                <div ref={zoneQuestionRef} tabIndex={-1} className="outline-none">
                  {surRecap ? (
                    <>
                      <h3 className="text-xl md:text-2xl font-bold mb-1v">Vérifie tes réponses</h3>
                      <p className="text-sm text-text-secondary mb-5v">Dernière étape avant l&apos;enregistrement.</p>
                      <RecapitulatifPreEnvoi reponses={r} />
                    </>
                  ) : (
                    <div key={ecrans[indexEcran].cle} className="max-w-xl mx-auto animate-[question-entree_260ms_ease-out]">
                      <h3 className="text-xl md:text-2xl font-bold leading-snug mb-6v text-center">{ecrans[indexEcran].titre}</h3>
                      {ecrans[indexEcran].contenu}
                    </div>
                  )}
                </div>

                {erreur && <Alerte ton="erreur">{erreur}</Alerte>}

                <div className="mt-8v pt-5v border-t border-border flex flex-wrap gap-3v items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => allerA(indexEcran - 1)}
                    disabled={indexEcran === 0}
                    icon={<ArrowLeft size={16} aria-hidden="true" />}
                  >
                    Retour
                  </Button>
                  {!surRecap ? (
                    <Button
                      size="lg"
                      onClick={() => allerA(indexEcran + 1)}
                      disabled={!ecranRepondu}
                      iconRight={<ArrowRight size={18} aria-hidden="true" />}
                    >
                      Suivant
                    </Button>
                  ) : (
                    <Button size="lg" loading={envoi} onClick={enregistrer} icon={!envoi && <CheckCircle2 size={18} aria-hidden="true" />}>
                      {envoi ? 'Enregistrement…' : 'Enregistrer mes réponses'}
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2v px-5v py-3v md:px-8v rounded-b-bj-md bg-background border-t border-border text-xs text-text-secondary">
                <ShieldCheck size={15} className="text-primary shrink-0" aria-hidden="true" />
                Tes réponses servent uniquement à personnaliser ton accompagnement.
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
