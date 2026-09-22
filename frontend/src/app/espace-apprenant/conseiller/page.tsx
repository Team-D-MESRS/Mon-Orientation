'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import axios from 'axios';
import { Bot, Mic, RotateCcw, Send, Square, Trash2 } from 'lucide-react';
import { conseillerApi, type LangueConseiller } from '@/lib/api';
import { messageErreur } from '@/lib/erreurs';
import { useEspace, useProfil } from '@/components/espace/EspaceContext';
import { Alerte, CHAMP } from '@/components/espace/ui';
import { TexteConseiller } from '@/components/espace/TexteConseiller';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';

interface Message {
  role: 'user' | 'assistant';
  texte: string;
  langue?: LangueConseiller;
}

const LANGUES: { code: LangueConseiller; libelle: string }[] = [
  { code: 'fr', libelle: 'Français' },
  { code: 'fon', libelle: 'Fɔ̀ngbè' },
];
/** Préférence de confort retenue par l'appareil, pas une donnée du dossier */
const CLE_LANGUE = 'conseiller-langue';

const SUGGESTIONS_ELEVE = [
  'Pourquoi le moteur me propose ces formations ?',
  'Quelles formations en agriculture après le BEPC ?',
  'À quels métiers mène la série D ?',
  'Et si je choisissais une autre formation ?',
];
const SUGGESTIONS_PARENT = [
  'Quelles formations sont proposées à mon enfant, et pourquoi ?',
  'Que veut dire DTM ?',
  'Quels débouchés après un bac technique ?',
];

/** « 65 » → « 1:05 » */
function formaterDuree(secondes: number) {
  const min = Math.floor(secondes / 60);
  const s = secondes % 60;
  return `${min}:${s.toString().padStart(2, '0')}`;
}

/** Message du serveur pour les indisponibilités (non configuré, trop de demandes), sinon message générique. */
function erreurConseiller(err: unknown) {
  if (axios.isAxiosError(err) && (err.response?.status === 503 || err.response?.status === 429)) {
    const message = (err.response.data as { message?: string } | undefined)?.message;
    if (message) return message;
  }
  return messageErreur(err);
}

export default function ConseillerPage() {
  const profil = useProfil();
  const { moi, estParent } = useEspace();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [saisie, setSaisie] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [langue, setLangue] = useState<LangueConseiller>('fr');
  const [enregistrement, setEnregistrement] = useState(false);
  const [duree, setDuree] = useState(0);
  const finRef = useRef<HTMLDivElement>(null);
  const enregistreurRef = useRef<MediaRecorder | null>(null);
  const morceauxRef = useRef<Blob[]>([]);
  const envoyerAuStopRef = useRef(true);
  const minuteurRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(CLE_LANGUE) === 'fon') setLangue('fon');
    } catch {
      // stockage indisponible : français par défaut
    }
  }, []);

  const choisirLangue = (code: LangueConseiller) => {
    setLangue(code);
    try {
      localStorage.setItem(CLE_LANGUE, code);
    } catch {
      // préférence non retenue, sans conséquence
    }
  };

  // Nouvelle conversation quand le parent change d'enfant
  useEffect(() => {
    setMessages([]);
    setConversationId(undefined);
    setErreur(null);
  }, [profil.nip]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, envoi]);

  if (moi.role !== 'APPRENANT' && moi.role !== 'PARENT') {
    return (
      <Alerte ton="info">
        Guido est réservé aux élèves et à leurs parents. Les conversations pourront être consultées pour la
        supervision dans l&apos;outil d&apos;administration.
      </Alerte>
    );
  }

  const envoyer = async (texte: string) => {
    const question = texte.trim();
    if (!question || envoi) return;
    setErreur(null);
    setMessages((m) => [...m, { role: 'user', texte: question }]);
    setSaisie('');
    setEnvoi(true);
    const langueDemandee = langue;
    try {
      const { data } = await conseillerApi.chat(profil.nip, question, conversationId, langueDemandee);
      setConversationId(data.conversationId);
      setMessages((m) => [...m, { role: 'assistant', texte: data.reponse, langue: langueDemandee }]);
    } catch (err) {
      // La question sans réponse est retirée et remise dans le champ, pour pouvoir la renvoyer
      setMessages((m) => m.slice(0, -1));
      setSaisie(question);
      setErreur(erreurConseiller(err));
    } finally {
      setEnvoi(false);
    }
  };

  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    envoyer(saisie);
  };

  const toucheClavier = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      envoyer(saisie);
    }
  };

  // Note vocale : à la place du message écrit, pour le fon, le yoruba, le mina et les autres langues locales
  // peu écrites — l'élève ou le parent parle, Guido comprend l'audio directement, sans étape de transcription.
  const envoyerNoteVocale = async (blob: Blob) => {
    if (envoi) return;
    setErreur(null);
    setMessages((m) => [...m, { role: 'user', texte: '🎤 Note vocale' }]);
    setEnvoi(true);
    const langueDemandee = langue;
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const lecteur = new FileReader();
        lecteur.onload = () => resolve((lecteur.result as string).split(',')[1] ?? '');
        lecteur.onerror = () => reject(lecteur.error);
        lecteur.readAsDataURL(blob);
      });
      const { data: reponse } = await conseillerApi.chat(profil.nip, undefined, conversationId, langueDemandee, {
        data,
        mimeType: blob.type || 'audio/webm',
      });
      setConversationId(reponse.conversationId);
      setMessages((m) => [...m, { role: 'assistant', texte: reponse.reponse, langue: langueDemandee }]);
    } catch (err) {
      setMessages((m) => m.slice(0, -1));
      setErreur(erreurConseiller(err));
    } finally {
      setEnvoi(false);
    }
  };

  const demarrerEnregistrement = async () => {
    setErreur(null);
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const enregistreur = new MediaRecorder(flux);
      morceauxRef.current = [];
      envoyerAuStopRef.current = true;
      enregistreur.ondataavailable = (e) => {
        if (e.data.size > 0) morceauxRef.current.push(e.data);
      };
      enregistreur.onstop = () => {
        flux.getTracks().forEach((piste) => piste.stop());
        if (envoyerAuStopRef.current && morceauxRef.current.length > 0) {
          envoyerNoteVocale(new Blob(morceauxRef.current, { type: enregistreur.mimeType }));
        }
      };
      enregistreur.start();
      enregistreurRef.current = enregistreur;
      setEnregistrement(true);
      setDuree(0);
      minuteurRef.current = setInterval(() => setDuree((d) => d + 1), 1000);
    } catch {
      setErreur("Le microphone n'est pas accessible depuis ce navigateur. Vérifie les autorisations, ou écris ta question.");
    }
  };

  const arreterEnregistrement = (envoyerLaNote: boolean) => {
    if (minuteurRef.current) clearInterval(minuteurRef.current);
    setEnregistrement(false);
    envoyerAuStopRef.current = envoyerLaNote;
    enregistreurRef.current?.stop();
  };

  useEffect(
    () => () => {
      if (minuteurRef.current) clearInterval(minuteurRef.current);
      if (enregistreurRef.current?.state === 'recording') {
        envoyerAuStopRef.current = false;
        enregistreurRef.current.stop();
      }
    },
    [],
  );

  const nouvelleConversation = () => {
    setMessages([]);
    setConversationId(undefined);
    setErreur(null);
  };

  const suggestions = estParent ? SUGGESTIONS_PARENT : SUGGESTIONS_ELEVE;
  const raccourcis = estParent
    ? ['Expliquez plus simplement', 'Comparez les deux meilleures pistes', 'Que devons-nous faire maintenant ?']
    : ['Explique plus simplement', 'Compare avec une autre formation', 'Que dois-je améliorer maintenant ?'];

  return (
    <section className="bg-surface rounded-bj-md border border-border flex flex-col h-[70vh] min-h-[28rem]">
      <div className="flex flex-wrap items-center justify-between gap-3v px-4v md:px-6v py-3v border-b border-border">
        <div className="flex items-center gap-3v">
          <Bot size={22} className="text-primary shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-bold text-sm">Guido</h2>
            <p className="text-xs text-text-secondary">Assistant automatique : il explique, il ne décide pas.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3v">
          <div role="group" aria-label="Langue des réponses" className="inline-flex rounded-bj-sm border border-border-strong overflow-hidden text-sm">
            {LANGUES.map(({ code, libelle }) => (
              <button
                key={code}
                type="button"
                lang={code}
                aria-pressed={langue === code}
                onClick={() => choisirLangue(code)}
                disabled={envoi}
                className={`px-3v py-1v font-medium transition-colors disabled:opacity-60 ${
                  langue === code ? 'bg-primary text-text-on-primary' : 'bg-surface text-text hover:text-primary'
                }`}
              >
                {libelle}
              </button>
            ))}
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={nouvelleConversation} disabled={envoi} icon={<RotateCcw size={14} aria-hidden="true" />} className="!px-0">
              Nouvelle conversation
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4v md:px-6v py-4v space-y-4v" aria-live="polite">
        {messages.length === 0 && (
          <div className="text-center py-6v">
            <p className="font-medium mb-1v">
              {estParent ? `Posez vos questions sur l'orientation de ${profil.prenom}.` : 'Pose tes questions sur ton orientation.'}
            </p>
            <p className="text-sm text-text-secondary mb-4v">
              Formations, métiers, résultats, propositions du moteur : Guido s&apos;appuie sur le catalogue
              officiel et sur le dossier scolaire.
            </p>
            <div className="flex flex-wrap justify-center gap-2v">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => envoyer(s)}
                  className="px-3v py-2v rounded-full border border-border-strong text-sm text-left hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="bubble-user max-w-[85%] text-sm whitespace-pre-wrap">{m.texte}</div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="bubble-assistant max-w-[85%]" lang={m.langue === 'fon' ? 'fon' : undefined}>
                <TexteConseiller texte={m.texte} />
              </div>
            </div>
          ),
        )}

        {envoi && (
          <div className="flex justify-start">
            <div className="bubble-assistant text-sm text-text-secondary" role="status">
              Guido réfléchit…
            </div>
          </div>
        )}
        <div ref={finRef} />
      </div>

      {erreur && (
        <div className="px-4v md:px-6v">
          <Alerte ton="erreur">{erreur}</Alerte>
        </div>
      )}

      {enregistrement ? (
        <div className="border-t border-border p-3v md:p-4v flex items-center gap-3v" role="status">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-danger opacity-75 animate-ping" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-danger" />
          </span>
          <p className="flex-1 text-sm font-medium">Enregistrement… {formaterDuree(duree)}</p>
          <IconButton variant="danger" icon={<Trash2 size={16} aria-hidden="true" />} label="Annuler la note vocale" onClick={() => arreterEnregistrement(false)} />
          <Button icon={<Square size={14} aria-hidden="true" />} onClick={() => arreterEnregistrement(true)}>
            <span className="hidden sm:inline">Envoyer</span>
            <span className="sr-only sm:hidden">Envoyer</span>
          </Button>
        </div>
      ) : (
        <>
        <form onSubmit={soumettre} className="border-t border-border p-3v md:p-4v flex gap-2v items-end">
          <label htmlFor="question" className="sr-only">
            {estParent ? 'Votre question' : 'Ta question'}
          </label>
          <textarea
            id="question"
            rows={2}
            maxLength={2000}
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={toucheClavier}
            disabled={envoi}
            placeholder={estParent ? 'Votre question…' : 'Ta question…'}
            // min-w-0 : sans ça, un <textarea> dans une ligne flex refuse de descendre sous sa largeur de
            // contenu naturelle et pousse les boutons voisins hors de leur taille prévue plutôt que de
            // rétrécir lui-même — au clavier mobile, sur les plus petits écrans (320px), le bouton micro se
            // retrouvait écrasé à 24px de large au lieu de 44.
            className={`${CHAMP} resize-none flex-1 min-w-0`}
          />
          <IconButton
            variant="secondary"
            icon={<Mic size={16} aria-hidden="true" />}
            label="Note vocale (fon, yoruba, mina…) — enregistrer une note vocale"
            disabled={envoi}
            onClick={demarrerEnregistrement}
            className="shrink-0"
          />
          <Button type="submit" icon={<Send size={16} aria-hidden="true" />} disabled={envoi || !saisie.trim()} className="shrink-0">
            <span className="hidden sm:inline">Envoyer</span>
            <span className="sr-only sm:hidden">Envoyer</span>
          </Button>
        </form>
        <p className="px-3v md:px-4v pb-1v text-xs text-text-secondary hidden sm:block">Entrée pour envoyer, Maj+Entrée pour revenir à la ligne.</p>
        </>
      )}
      <div className="px-4v md:px-6v pb-2v flex flex-wrap gap-2v" aria-label="Raccourcis de question">
        {raccourcis.map((question) => <button key={question} type="button" onClick={() => envoyer(question)} disabled={envoi} className="px-3v py-1v rounded-full border border-border-strong text-xs text-text hover:border-primary hover:text-primary disabled:opacity-50">{question}</button>)}
      </div>
      <p className="px-4v md:px-6v pb-3v text-xs text-text-secondary">
        {estParent
          ? "Vérifiez les informations importantes auprès de l'établissement. La décision d'orientation revient à votre enfant et à votre famille."
          : "Vérifie les informations importantes auprès de ton établissement. La décision d'orientation t'appartient, avec ta famille."}
        {langue === 'fon' &&
          (estParent
            ? ' Les réponses en fongbé sont rédigées automatiquement : en cas de doute, posez la question en français.'
            : ' Les réponses en fongbé sont rédigées automatiquement : en cas de doute, demande en français.')}
      </p>
    </section>
  );
}
