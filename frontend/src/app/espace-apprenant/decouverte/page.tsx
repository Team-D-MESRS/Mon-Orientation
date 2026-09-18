'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { apprenantApi } from '@/lib/api';
import {
  type Decouverte,
  type MatierePreferee,
  type Priorite,
  type Qualite,
  type ReponsesDecouverte,
  dateLisible,
  etiquetteProfil,
} from '@/lib/apprenant';
import { DOMAINE_LABELS, type Domaine } from '@/lib/filiere';
import { messageErreur } from '@/lib/erreurs';
import { useEspace, useProfil } from '@/components/espace/EspaceContext';
import { Alerte, Chargement } from '@/components/espace/ui';
import { useDecouverteStore } from '@/stores/decouverteStore';

const NB_ETAPES = 5;
const MAX_INTERETS = 5;
const MAX_PRIORITES = 3;
const MAX_QUALITES = 5;

const VIDE: ReponsesDecouverte = {
  interets: [],
  matierePreferee: 'Aucune',
  metierEnvisage: null,
  apresCollege: 'INDECIS',
  styleTravail: 'MIXTE',
  statut: 'INDECIS',
  dureeEtudes: 'PEU_IMPORTE',
  priorites: [],
  qualites: [],
  internat: 'INDECIS',
  mobiliteDepartement: 'INDECIS',
};

const DOMAINES_16 = Object.keys(DOMAINE_LABELS) as Domaine[];

const LABEL_MATIERE: Record<MatierePreferee, string> = {
  Mathématiques: 'Mathématiques',
  PCT: 'Physique-Chimie-Technologie',
  SVT: 'Sciences de la Vie et de la Terre',
  Français: 'Français',
  'Histoire-Géographie': 'Histoire-Géographie',
  Anglais: 'Anglais',
  EPS: 'Éducation physique et sportive',
  Arts: 'Arts (musique, dessin…)',
  Aucune: 'Aucune en particulier',
};
const MATIERES: MatierePreferee[] = [
  'Mathématiques',
  'PCT',
  'SVT',
  'Français',
  'Histoire-Géographie',
  'Anglais',
  'EPS',
  'Arts',
  'Aucune',
];

const LABEL_QUALITE: Record<Qualite, string> = {
  MANUEL: 'Bricoleur(se), manuel(le)',
  SCIENTIFIQUE: "Curieux(se), j'aime comprendre comment ça marche",
  CREATIF: "Créatif(ve), j'aime imaginer ou dessiner",
  ORGANISE: 'Organisé(e), rigoureux(se)',
  RELATIONNEL: "À l'aise pour parler aux gens",
  MINUTIEUX: 'Patient(e), minutieux(se)',
  SPORTIF: "Sportif(ve), j'aime bouger",
  LOGIQUE: 'Bon(ne) en calcul, en logique',
  BIENVEILLANT: "J'aime prendre soin des autres",
  NATURE: "J'aime les plantes, les animaux",
  MENEUR: "Meneur(se), j'aime organiser un groupe",
  PEDAGOGUE: "J'aime expliquer, transmettre ce que je sais",
};
const QUALITES: Qualite[] = [
  'MANUEL',
  'SCIENTIFIQUE',
  'CREATIF',
  'ORGANISE',
  'RELATIONNEL',
  'MINUTIEUX',
  'SPORTIF',
  'LOGIQUE',
  'BIENVEILLANT',
  'NATURE',
  'MENEUR',
  'PEDAGOGUE',
];

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
  return <Questionnaire reponsesActuelles={decouverte?.reponses ?? null} onEnregistre={setDecouverte} />;
}

function DecouverteEnLecture({ prenom, decouverte }: { prenom: string; decouverte: Decouverte | null }) {
  if (!decouverte) {
    return <Alerte ton="info">{prenom} n&apos;a pas encore rempli le questionnaire de découverte.</Alerte>;
  }
  const r = decouverte.reponses;
  return (
    <section className="bg-white rounded-bj-md border border-bj-gray-925 p-6v space-y-4v">
      <h2 className="text-xl font-bold">Ce que {prenom} a dit de lui-même</h2>
      <p className="text-sm text-bj-gray-500">{etiquetteProfil(decouverte)}</p>
      {r.metierEnvisage && (
        <p>
          <span className="text-bj-gray-500">Métier envisagé : </span>« {r.metierEnvisage} »
        </p>
      )}
      {r.interets.length > 0 && (
        <div>
          <p className="text-sm text-bj-gray-500 mb-2v">Ce qui lui plaît</p>
          <Puces elements={r.interets.map((d) => DOMAINE_LABELS[d])} />
        </div>
      )}
      {r.qualites.length > 0 && (
        <div>
          <p className="text-sm text-bj-gray-500 mb-2v">Les qualités qu&apos;il/elle se trouve</p>
          <Puces elements={r.qualites.map((q) => LABEL_QUALITE[q])} />
        </div>
      )}
      <p className="text-xs text-bj-gray-500">Rempli le {dateLisible(decouverte.dateSaisie)}.</p>
    </section>
  );
}

function Puces({ elements }: { elements: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2v">
      {elements.map((e) => (
        <li key={e} className="px-3v py-1v rounded-full bg-bj-green/10 text-bj-green text-sm font-medium">
          {e}
        </li>
      ))}
    </ul>
  );
}

function Etiquette({
  selectionne,
  onClick,
  children,
}: {
  selectionne: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selectionne}
      onClick={onClick}
      className={`px-4v py-2v rounded-full border text-sm font-medium text-left transition-colors ${
        selectionne ? 'border-bj-green bg-bj-green/10 text-bj-green ring-1 ring-bj-green' : 'border-bj-gray-850 text-bj-gray-200 hover:border-bj-green'
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

function Question({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="mb-6v">
      <h3 className="font-bold mb-3v">{titre}</h3>
      {children}
    </div>
  );
}

function Questionnaire({
  reponsesActuelles,
  onEnregistre,
}: {
  reponsesActuelles: ReponsesDecouverte | null;
  onEnregistre: (decouverte: Decouverte) => void;
}) {
  const profil = useProfil();
  const [r, setR] = useState<ReponsesDecouverte>(reponsesActuelles ?? VIDE);
  const [etape, setEtape] = useState(1);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const [decouverteEnregistree, setDecouverteEnregistree] = useState<Decouverte | null>(null);

  const maj = <K extends keyof ReponsesDecouverte>(champ: K, valeur: ReponsesDecouverte[K]) =>
    setR((actuel) => ({ ...actuel, [champ]: valeur }));

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
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  const TITRES = [
    'Ce qui te plaît',
    'Ce que tu envisages',
    'Tes ambitions',
    'Les qualités que tu te trouves',
    'Tes contraintes pratiques',
  ];

  return (
    <section className="bg-white rounded-bj-md border border-bj-gray-925 p-6v">
      {!reponsesActuelles && (
        <Alerte ton="info">
          Réponds du mieux que tu peux : il n&apos;y a pas de bonne ou de mauvaise réponse. Ça sert à mieux te connaître avant de te proposer des
          pistes — tu pourras revenir modifier tes réponses plus tard.
        </Alerte>
      )}

      <div className="mb-6v">
        <p className="text-sm font-medium text-bj-green mb-2v">
          Étape {etape} sur {NB_ETAPES}
        </p>
        <div
          className="h-2 rounded-full bg-bj-gray-925 overflow-hidden"
          role="progressbar"
          aria-label="Progression du questionnaire de découverte"
          aria-valuemin={0}
          aria-valuemax={NB_ETAPES}
          aria-valuenow={etape}
        >
          <div className="h-full bg-bj-green transition-all" style={{ width: `${(etape / NB_ETAPES) * 100}%` }} />
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4v">{TITRES[etape - 1]}</h2>

      {etape === 1 && (
        <>
          <Question titre="Qu'est-ce qui te plaît de faire ?">
            <ChoixMultiple options={DOMAINES_16} labels={DOMAINE_LABELS} valeurs={r.interets} onChange={(v) => maj('interets', v)} max={MAX_INTERETS} />
          </Question>
          <Question titre="Ta matière préférée à l'école, si tu devais en choisir une seule ?">
            <ChoixUnique options={MATIERES} labels={LABEL_MATIERE} valeur={r.matierePreferee ?? 'Aucune'} onChange={(v) => maj('matierePreferee', v)} />
          </Question>
        </>
      )}

      {etape === 2 && (
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
          <Question titre="Tu te sens plutôt attiré(e) par…">
            <ChoixUnique
              options={['TECHNIQUE', 'GENERAL', 'INDECIS'] as const}
              labels={{ TECHNIQUE: 'Les formations techniques (concrètes, pratiques)', GENERAL: 'Les études générales', INDECIS: 'Je ne sais pas encore' }}
              valeur={r.apresCollege}
              onChange={(v) => maj('apresCollege', v)}
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

      {etape === 3 && (
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

      {etape === 4 && (
        <Question titre="Coche ce qui te ressemble le plus">
          <ChoixMultiple options={QUALITES} labels={LABEL_QUALITE} valeurs={r.qualites} onChange={(v) => maj('qualites', v)} max={MAX_QUALITES} />
        </Question>
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

      {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
      {enregistre && decouverteEnregistree && (
        <Alerte ton="succes">
          Réponses enregistrées. {etiquetteProfil(decouverteEnregistree)}{' '}
          <Link href="/espace-apprenant/recommandations" className="font-medium underline">
            Voir mes pistes
          </Link>
        </Alerte>
      )}

      <div className="flex flex-wrap gap-3v justify-between mt-6v">
        <button
          type="button"
          onClick={() => setEtape(Math.max(1, etape - 1))}
          disabled={etape === 1}
          className="bj-btn bj-btn-secondary disabled:opacity-40"
        >
          ← Retour
        </button>
        {etape < NB_ETAPES ? (
          <button type="button" onClick={() => setEtape(etape + 1)} className="bj-btn bj-btn-primary">
            Suivant →
          </button>
        ) : (
          <button type="button" onClick={enregistrer} disabled={envoi} className="bj-btn bj-btn-primary disabled:opacity-60 inline-flex items-center gap-2v">
            {envoi ? (
              'Enregistrement…'
            ) : (
              <>
                <CheckCircle2 size={16} aria-hidden="true" /> Enregistrer mes réponses
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
