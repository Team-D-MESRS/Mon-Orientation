'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Clock3, ShieldCheck } from 'lucide-react';
import { apprenantApi } from '@/lib/api';
import { type Decouverte, type Priorite, type ReponsesDecouverte, dateLisible, etiquetteProfil } from '@/lib/apprenant';
import {
  BANQUE_RIASEC,
  CODES_RIASEC,
  LABELS_LIKERT,
  LABELS_RIASEC,
  PHRASES_RIASEC,
  codesDominants,
  scoresRiasec,
  type QuestionRiasec,
  type ReponseRiasec,
  type ValeurLikert,
} from '@/lib/riasec';
import { messageErreur } from '@/lib/erreurs';
import { useEspace, useProfil } from '@/components/espace/EspaceContext';
import { Alerte, Chargement } from '@/components/espace/ui';
import { useDecouverteStore } from '@/stores/decouverteStore';

const NB_ETAPES = 5;
const MAX_PRIORITES = 3;

// 24 questions principales, réparties équitablement entre les 6 dimensions RIASEC.
// Les autres items restent connus du moteur mais sont complétés par une valeur neutre à l'envoi.
const QUESTIONS_PAR_DIMENSION = 4;
const QUESTIONS_PARCOURS = BANQUE_RIASEC.filter((_, index) => index % 6 < QUESTIONS_PAR_DIMENSION);
const BANQUE_ETAPE_1 = QUESTIONS_PARCOURS.slice(0, 12);
const BANQUE_ETAPE_2 = QUESTIONS_PARCOURS.slice(12);
const NB_QUESTIONS_PARCOURS = QUESTIONS_PARCOURS.length;

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
    <section className="bg-white rounded-bj-md border border-bj-gray-925 p-6v space-y-4v">
      <h2 className="text-xl font-bold">Ce que {prenom} a dit de lui-même</h2>
      <ResultatProfil decouverte={decouverte} />
      {r.metierEnvisage && (
        <p>
          <span className="text-bj-gray-500">Métier envisagé : </span>« {r.metierEnvisage} »
        </p>
      )}
      <p className="text-xs text-bj-gray-500">Rempli le {dateLisible(decouverte.dateSaisie)}.</p>
    </section>
  );
}

/** Résultat du test : barres par dimension RIASEC, phrase du/des code(s) dominant(s), actions rapides. */
function ResultatProfil({ decouverte }: { decouverte: Decouverte }) {
  const scores = scoresRiasec(decouverte.reponses.riasec);
  const dominants = codesDominants(scores);
  return (
    <div className="bg-bj-green/5 border border-bj-green/30 rounded-bj-md p-4v space-y-4v">
      <div>
        <p className="text-xs font-medium text-bj-green uppercase tracking-wide mb-1v">Ton profil</p>
        <p className="text-sm">{etiquetteProfil(decouverte)}</p>
      </div>
      <div className="space-y-2v">
        {CODES_RIASEC.map((code) => (
          <div key={code} className="flex items-center gap-3v">
            <span className="w-32 text-xs text-bj-gray-500 shrink-0">{LABELS_RIASEC[code]}</span>
            <div className="flex-1 h-2 rounded-full bg-bj-gray-925 overflow-hidden">
              <div className="h-full bg-bj-green" style={{ width: `${Math.round(scores[code] * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      {dominants.length > 0 && (
        <p className="text-sm text-bj-gray-500">
          {dominants.map((c) => PHRASES_RIASEC[c]).join(' ; ')}.
        </p>
      )}
      <div className="flex flex-wrap gap-3v pt-1v">
        <Link href="/catalogue" className="bj-btn bj-btn-secondary text-sm">
          Explorer le catalogue
        </Link>
        <Link href="/espace-apprenant/recommandations" className="bj-btn bj-btn-secondary text-sm">
          Voir mes pistes
        </Link>
        <Link href="/espace-apprenant/conseiller" className="bj-btn bj-btn-secondary text-sm">
          Parler à Guido
        </Link>
      </div>
    </div>
  );
}

function ResumeOnboarding({ reponses }: { reponses: ReponsesDecouverte }) {
  const valeur = (texte: string | null | undefined, remplacement: string) => texte || remplacement;
  const format = (texte: string) => texte.replaceAll('_', ' ').toLowerCase();
  const scores = scoresRiasec(reponses.riasec);
  const dominants = codesDominants(scores).map((code) => LABELS_RIASEC[code]);
  const lectureInterets = dominants.length ? dominants.join(' et ') : 'encore à préciser';
  const lectureTravail = reponses.styleTravail === 'MANUEL' ? 'concret, pratique et sur le terrain' : reponses.styleTravail === 'INTELLECTUEL' ? 'réflexif, avec des idées, des chiffres ou des mots' : 'varié, avec un peu de pratique et de réflexion';
  return (
    <div className="space-y-5v">
      <p className="text-sm md:text-base text-bj-gray-500">
        Ton profil est prêt. Vérifie ces quelques éléments avant de découvrir ton espace personnel et les premières pistes proposées.
      </p>
      <div className="rounded-bj-sm border border-bj-green/30 bg-bj-green/5 p-4v md:p-5v">
        <p className="text-xs font-semibold uppercase tracking-wide text-bj-green mb-2v">Première lecture de ton profil</p>
        <p className="font-semibold">Tu sembles particulièrement attiré(e) par les activités liées au profil {lectureInterets}.</p>
        <p className="text-sm text-bj-gray-500 mt-1v">Tu pourrais apprécier un environnement de travail {lectureTravail}. Ces premières indications serviront à classer les formations techniques à explorer.</p>
      </div>
      <div className="grid gap-3v md:grid-cols-2">
        <div className="rounded-bj-sm border border-bj-gray-925 bg-bj-gray-975 p-4v">
          <p className="text-xs font-semibold uppercase tracking-wide text-bj-gray-500 mb-1v">Tes intérêts</p>
          <p className="font-semibold">Profil construit à partir de {NB_QUESTIONS_PARCOURS} questions</p>
        </div>
        <div className="rounded-bj-sm border border-bj-gray-925 bg-bj-gray-975 p-4v">
          <p className="text-xs font-semibold uppercase tracking-wide text-bj-gray-500 mb-1v">Métier envisagé</p>
          <p className="font-semibold">{valeur(reponses.metierEnvisage, 'Je suis encore en réflexion')}</p>
        </div>
        <div className="rounded-bj-sm border border-bj-gray-925 bg-bj-gray-975 p-4v">
          <p className="text-xs font-semibold uppercase tracking-wide text-bj-gray-500 mb-1v">Ta façon de travailler</p>
          <p className="font-semibold">{format(reponses.styleTravail)}</p>
        </div>
        <div className="rounded-bj-sm border border-bj-gray-925 bg-bj-gray-975 p-4v">
          <p className="text-xs font-semibold uppercase tracking-wide text-bj-gray-500 mb-1v">Ce qui compte pour toi</p>
          <p className="font-semibold">{reponses.priorites.length ? reponses.priorites.map((p) => LABEL_PRIORITE[p]).join(' · ') : 'Pas encore défini'}</p>
        </div>
      </div>
      <div className="rounded-bj-sm border-l-4 border-bj-green bg-bj-green/5 p-4v text-sm">
        Tu pourras modifier tes réponses plus tard. Elles servent à personnaliser ton accompagnement, pas à prendre une décision à ta place.
      </div>
    </div>
  );
}

function Etiquette({
  selectionne,
  onClick,
  ariaLabel,
  children,
}: {
  selectionne: boolean;
  onClick: () => void;
  ariaLabel?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selectionne}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`px-4v py-2v rounded-full border text-sm font-medium text-left transition-colors ${
        selectionne ? 'border-bj-green bg-bj-green text-white shadow-sm' : 'border-bj-gray-850 bg-white text-bj-gray-200 hover:border-bj-green hover:bg-bj-green/5'
      }`}
    >
      {children}
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
    <div className="flex flex-wrap gap-2v" role="radiogroup">
      {options.map((o) => (
        <Etiquette key={o} selectionne={valeur === o} onClick={() => onChange(o)}>
          {labels[o]}
        </Etiquette>
      ))}
    </div>
  );
}

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
      <div className="flex flex-wrap gap-2v">
        {options.map((o) => (
          <Etiquette key={o} selectionne={valeurs.includes(o)} onClick={() => basculer(o)}>
            {labels[o]}
          </Etiquette>
        ))}
      </div>
      <p className="text-xs text-bj-gray-500 mt-2v">
        {valeurs.length}/{max} choisi{valeurs.length > 1 ? 's' : ''}.
      </p>
    </div>
  );
}

const VALEURS_LIKERT: ValeurLikert[] = [1, 2, 3, 4, 5];

/** Une question RIASEC avec son échelle 1 (pas du tout) à 5 (beaucoup). */
function EchelleLikert({ question, valeur, onChange, numero }: { question: QuestionRiasec; valeur: ValeurLikert | undefined; onChange: (v: ValeurLikert) => void; numero: number }) {
  return (
    <div className="py-4v px-3v md:px-4v mb-2v rounded-bj-sm border border-bj-gray-925 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] last:mb-0" data-id-question={question.id}>
      <p className="text-sm leading-relaxed mb-3v"><span className="text-xs font-semibold text-bj-green mr-2v">Question {numero}/{NB_QUESTIONS_PARCOURS}</span>{question.texte}</p>
      <div className="flex flex-wrap gap-2v" role="radiogroup" aria-label={question.texte}>
        {VALEURS_LIKERT.map((v) => (
          <Etiquette key={v} selectionne={valeur === v} onClick={() => onChange(v)} ariaLabel={`${v} - ${LABELS_LIKERT[v]}`}>
            {v}
          </Etiquette>
        ))}
      </div>
    </div>
  );
}

function EtapeRiasec({ banque, reponses, onChange, decalage }: { banque: QuestionRiasec[]; reponses: ReponseRiasec[]; onChange: (id: string, valeur: ValeurLikert) => void; decalage: number }) {
  const valeurDe = (id: string) => reponses.find((x) => x.id === id)?.valeur;
  const repondues = banque.filter((q) => valeurDe(q.id) !== undefined).length;
  return (
    <div>
      {banque.map((q, index) => (
        <EchelleLikert key={q.id} question={q} valeur={valeurDe(q.id)} numero={decalage + index + 1} onChange={(v) => onChange(q.id, v)} />
      ))}
      <p className="text-xs text-bj-gray-500 mt-3v">
        {decalage + repondues}/{NB_QUESTIONS_PARCOURS} questions principales répondues.
      </p>
    </div>
  );
}

function Question({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="mb-6v rounded-bj-sm border border-bj-gray-925 bg-white p-4v md:p-5v shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <h3 className="font-bold leading-relaxed mb-3v">{titre}</h3>
      {children}
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
  const [etape, setEtape] = useState(1);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const [decouverteEnregistree, setDecouverteEnregistree] = useState<Decouverte | null>(decouverteActuelle);
  const [modifier, setModifier] = useState(!reponsesActuelles);
  const [brouillonCharge, setBrouillonCharge] = useState(!!reponsesActuelles);

  const cleBrouillon = `mon-orientation:onboarding:${profil.nip}`;

  useEffect(() => {
    if (reponsesActuelles || typeof window === 'undefined') {
      setBrouillonCharge(true);
      return;
    }
    try {
      const brouillon = window.localStorage.getItem(cleBrouillon);
      if (brouillon) setR(JSON.parse(brouillon) as ReponsesDecouverte);
    } catch {
      // Un brouillon local corrompu ne doit jamais empêcher l'accès au questionnaire.
    } finally {
      setBrouillonCharge(true);
    }
  }, [cleBrouillon, reponsesActuelles]);

  useEffect(() => {
    if (!brouillonCharge || !modifier || typeof window === 'undefined') return;
    const minuterie = window.setTimeout(() => {
      window.localStorage.setItem(cleBrouillon, JSON.stringify(r));
    }, 250);
    return () => window.clearTimeout(minuterie);
  }, [brouillonCharge, cleBrouillon, decouverteEnregistree, modifier, r]);

  const maj = <K extends keyof ReponsesDecouverte>(champ: K, valeur: ReponsesDecouverte[K]) =>
    setR((actuel) => ({ ...actuel, [champ]: valeur }));

  // Mutateur fonctionnel (pas juste `maj('riasec', [...r.riasec, ...])`) : plusieurs réponses
  // peuvent être enregistrées dans la même rafale d'évènements (ex. remplissage automatisé des
  // tests) sans attendre un nouveau rendu entre chaque clic — une fermeture sur `r.riasec` figée au
  // rendu précédent ferait perdre toutes les réponses sauf la dernière.
  const definirRiasec = (id: string, valeur: ValeurLikert) =>
    setR((actuel) => ({ ...actuel, riasec: [...actuel.riasec.filter((x) => x.id !== id), { id, valeur }] }));

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
      setModifier(false);
      window.localStorage.removeItem(cleBrouillon);
      if (!reponsesActuelles) router.replace('/espace-apprenant');
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  const TITRES = ['Ce qui te plaît (1/2)', 'Ce qui te plaît (2/2)', 'Ce que tu envisages', 'Tes ambitions', 'Tes contraintes pratiques'];
  const SOUS_TITRES = [
    'Prends ton temps : il n’y a pas de bonne ou de mauvaise réponse.',
    'On continue tranquillement avec ce qui t’attire au quotidien.',
    'Même une idée qui change peut nous aider à mieux t’accompagner.',
    'Imagine le travail et la vie professionnelle qui te correspondraient.',
    'Ces réponses nous aident à te proposer des parcours réalistes et accessibles.',
  ];
  const allerAEtape = (nouvelleEtape: number) => {
    setEtape(nouvelleEtape);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  };

  return (
    <div className="space-y-6v">
      {decouverteEnregistree && !modifier && (
        <section className="bg-white rounded-bj-md border border-bj-gray-925 p-6v">
          <div className="flex items-center justify-between mb-4v">
            <h2 className="text-xl font-bold">Ton profil d&apos;intérêts</h2>
            <button
              type="button"
              onClick={() => {
                setEnregistre(false);
                setModifier(true);
              }}
              className="text-sm font-medium text-bj-green hover:underline inline-flex items-center gap-1v"
            >
              Modifier mes réponses <ChevronDown size={16} aria-hidden="true" />
            </button>
          </div>
          {enregistre && <Alerte ton="succes">Réponses enregistrées.</Alerte>}
          <ResultatProfil decouverte={decouverteEnregistree} />
        </section>
      )}

      {(modifier || !decouverteEnregistree) && (
        <section className="overflow-hidden bg-white rounded-bj-md border border-bj-gray-925 shadow-sm">
          <div className="bg-gradient-to-br from-bj-green/10 via-white to-bj-yellow/10 px-5v py-6v md:px-8v md:py-8v border-b border-bj-gray-925">
            <div className="flex flex-wrap items-start justify-between gap-4v mb-5v">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-bj-green mb-2v">
                  {reponsesActuelles ? 'Mettre à jour ton profil' : 'Ton parcours commence ici'}
                </p>
                <h2 className="text-2xl md:text-3xl font-bold mb-2v">Apprenons à mieux te connaître</h2>
                <p className="text-sm md:text-base text-bj-gray-500 max-w-2xl">
                  Il n&apos;y a pas de bonne ou de mauvaise réponse. Tes réponses restent liées à ton dossier et pourront être modifiées plus tard.
                </p>
              </div>
              <div className="flex items-center gap-2v rounded-full bg-white/80 border border-bj-gray-925 px-3v py-2v text-xs text-bj-gray-500">
                <Clock3 size={15} className="text-bj-green" aria-hidden="true" />
                Environ 5 minutes
              </div>
            </div>
            <div className="flex items-center gap-3v text-xs text-bj-gray-500">
              <div className="h-2 flex-1 rounded-full bg-white overflow-hidden" role="progressbar" aria-label="Progression du questionnaire de découverte" aria-valuemin={1} aria-valuemax={NB_ETAPES} aria-valuenow={Math.min(etape, NB_ETAPES)}>
                <div className="h-full rounded-full bg-bj-green transition-all" style={{ width: `${(Math.min(etape, NB_ETAPES) / NB_ETAPES) * 100}%` }} />
              </div>
              <span className="font-semibold text-bj-green whitespace-nowrap">{etape > NB_ETAPES ? 'Terminé' : `${etape}/${NB_ETAPES}`}</span>
            </div>
            <div className="hidden md:flex justify-between mt-2v text-[11px] text-bj-gray-500">
              <span className={etape === 1 ? 'font-semibold text-bj-green' : ''}>Tes intérêts</span>
              <span className={etape === 2 ? 'font-semibold text-bj-green' : ''}>Tes préférences</span>
              <span className={etape === 3 ? 'font-semibold text-bj-green' : ''}>Tes envies</span>
              <span className={etape === 4 ? 'font-semibold text-bj-green' : ''}>Tes ambitions</span>
              <span className={etape === 5 ? 'font-semibold text-bj-green' : ''}>Ta situation</span>
            </div>
            {modifier && brouillonCharge && (
              <p className="text-xs text-bj-green mt-4v">Tes réponses sont enregistrées automatiquement sur cet appareil.</p>
            )}
          </div>

          <div className="px-5v py-6v md:px-8v md:py-8v bg-[#fffdfa]">
            <div className="flex items-start gap-3v mb-6v rounded-bj-sm border border-bj-yellow/40 bg-bj-yellow/10 p-4v">
              <div className="w-10 h-10 rounded-full bg-bj-green text-white flex items-center justify-center shrink-0 font-bold shadow-sm">{etape}</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-bj-gray-500 mb-1v">{etape > NB_ETAPES ? 'Dernière étape' : `Étape ${etape}`}</p>
                <h3 className="text-xl md:text-2xl font-bold">{etape > NB_ETAPES ? 'Vérifie tes réponses' : TITRES[etape - 1]}</h3>
                {etape <= NB_ETAPES && <p className="text-sm text-bj-gray-500 mt-1v">{SOUS_TITRES[etape - 1]}</p>}
              </div>
            </div>

          {etape > NB_ETAPES ? (
            <ResumeOnboarding reponses={r} />
          ) : (
            <>
          {etape === 1 && <EtapeRiasec banque={BANQUE_ETAPE_1} reponses={r.riasec} onChange={definirRiasec} decalage={0} />}
          {etape === 2 && <EtapeRiasec banque={BANQUE_ETAPE_2} reponses={r.riasec} onChange={definirRiasec} decalage={BANQUE_ETAPE_1.length} />}

          {etape === 3 && (
            <>
              <Question titre="As-tu une idée du métier que tu voudrais faire plus tard ?">
                <label htmlFor="metier-envisage" className="sr-only">
                  Métier envisagé
                </label>
                <input
                  id="metier-envisage"
                  type="text"
                  maxLength={200}
                  value={r.metierEnvisage ?? ''}
                  onChange={(e) => maj('metierEnvisage', e.target.value || null)}
                  placeholder="Facultatif : le métier auquel tu penses, même si ce n'est pas encore sûr"
                  className="w-full px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-bj-green"
                />
              </Question>
              <Question titre="Tu préférerais plutôt…">
                <ChoixUnique
                  options={['MANUEL', 'INTELLECTUEL', 'MIXTE'] as const}
                  labels={{ MANUEL: 'Travailler avec tes mains, sur le terrain', INTELLECTUEL: 'Travailler avec des idées, des chiffres ou des mots', MIXTE: 'Un peu des deux' }}
                  valeur={r.styleTravail}
                  onChange={(v) => maj('styleTravail', v)}
                />
              </Question>
            </>
          )}

          {etape === 4 && (
            <>
              <Question titre="Plus tard, tu aimerais plutôt…">
                <ChoixUnique
                  options={['SALARIE', 'ENTREPRENEUR', 'LES_DEUX', 'INDECIS'] as const}
                  labels={{ SALARIE: 'Être salarié(e) dans une entreprise ou une administration', ENTREPRENEUR: 'Créer ta propre activité', LES_DEUX: 'Les deux, ça dépendra', INDECIS: 'Je ne sais pas encore' }}
                  valeur={r.statut}
                  onChange={(v) => maj('statut', v)}
                />
              </Question>
              <Question titre="Tu préférerais…">
                <ChoixUnique
                  options={['COURTE', 'LONGUE', 'PEU_IMPORTE'] as const}
                  labels={{ COURTE: 'Une formation courte pour travailler vite', LONGUE: 'Des études plus longues', PEU_IMPORTE: 'Peu importe, si le métier me plaît' }}
                  valeur={r.dureeEtudes}
                  onChange={(v) => maj('dureeEtudes', v)}
                />
              </Question>
              <Question titre="Ce qui compte le plus pour toi dans un métier">
                <ChoixMultiple options={PRIORITES} labels={LABEL_PRIORITE} valeurs={r.priorites} onChange={(v) => maj('priorites', v)} max={MAX_PRIORITES} />
              </Question>
            </>
          )}

          {etape === 5 && (
            <>
              <Question titre="Partir en internat, loin de chez toi, ça te conviendrait ?">
                <ChoixUnique
                  options={['OUI', 'NON', 'INDECIS'] as const}
                  labels={{ OUI: 'Oui', NON: 'Non', INDECIS: 'Je ne sais pas encore' }}
                  valeur={r.internat}
                  onChange={(v) => maj('internat', v)}
                />
              </Question>
              <Question titre="Es-tu prêt(e) à te former dans un autre département si la formation qui te plaît n'existe pas près de chez toi ?">
                <ChoixUnique
                  options={['OUI', 'NON', 'INDECIS'] as const}
                  labels={{ OUI: 'Oui', NON: 'Non', INDECIS: 'Je ne sais pas encore' }}
                  valeur={r.mobiliteDepartement}
                  onChange={(v) => maj('mobiliteDepartement', v)}
                />
              </Question>
            </>
          )}
            </>
          )}

          {erreur && <Alerte ton="erreur">{erreur}</Alerte>}

          <div className="mt-8v pt-5v border-t border-bj-gray-925 flex flex-wrap gap-3v items-center justify-between">
            <button
              type="button"
              onClick={() => allerAEtape(Math.max(1, etape - 1))}
              disabled={etape === 1}
              className="bj-btn bj-btn-secondary disabled:opacity-40"
            >
              <ArrowLeft size={16} aria-hidden="true" /> Retour
            </button>
            {etape < NB_ETAPES ? (
              <button type="button" onClick={() => allerAEtape(etape + 1)} className="bj-btn bj-btn-primary">
                Suivant <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : etape === NB_ETAPES ? (
              <button type="button" onClick={() => allerAEtape(NB_ETAPES + 1)} className="bj-btn bj-btn-primary">
                Vérifier mes réponses <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <button type="button" onClick={enregistrer} disabled={envoi} className="bj-btn bj-btn-primary disabled:opacity-60 inline-flex items-center gap-2v">
                {envoi ? (
                  'Enregistrement…'
                ) : (
                  <>
                    <CheckCircle2 size={16} aria-hidden="true" /> Enregistrer et accéder au tableau de bord
                  </>
                )}
              </button>
            )}
          </div>
          </div>
          <div className="flex items-center gap-2v px-5v py-3v md:px-8v bg-bj-gray-975 border-t border-bj-gray-925 text-xs text-bj-gray-500">
            <ShieldCheck size={15} className="text-bj-green shrink-0" aria-hidden="true" />
            Tes réponses servent uniquement à personnaliser ton accompagnement.
          </div>
        </section>
      )}
    </div>
  );
}
