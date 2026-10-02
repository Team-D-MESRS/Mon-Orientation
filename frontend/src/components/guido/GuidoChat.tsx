'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import axios from 'axios';
import { Bot, RotateCcw, Send } from 'lucide-react';
import { conseillerApi } from '@/lib/api';
import { messageErreur } from '@/lib/erreurs';
import { useEspace, useProfil } from '@/components/espace/EspaceContext';
import { Alerte, CHAMP } from '@/components/espace/ui';
import { TexteConseiller } from '@/components/espace/TexteConseiller';
import { Button } from '@/components/ui/Button';

interface Message {
  role: 'user' | 'assistant';
  texte: string;
}

const SUGGESTIONS_ELEVE = [
  "J'aime bricoler, quels métiers techniques pourrais-je découvrir ?",
  'Quelles formations techniques après le BEPC ?',
  'Quels lycées techniques proposent une formation près de chez moi ?',
  'Quels débouchés après une formation agricole ?',
];
const SUGGESTIONS_PARENT = [
  'Quels métiers techniques pourraient intéresser mon enfant ?',
  'Quelles formations techniques sont accessibles après le BEPC ?',
  'Quels lycées techniques proposent une formation près de chez nous ?',
];

/** Message du serveur pour les indisponibilités (non configuré, trop de demandes), sinon message générique. */
function erreurConseiller(err: unknown) {
  if (axios.isAxiosError(err) && (err.response?.status === 503 || err.response?.status === 429)) {
    const message = (err.response.data as { message?: string } | undefined)?.message;
    if (message) return message;
  }
  return messageErreur(err);
}

export default function GuidoChat() {
  const profil = useProfil();
  const { moi, estParent } = useEspace();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [saisie, setSaisie] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

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
    try {
      const { data } = await conseillerApi.chat(profil.nip, question, conversationId);
      setConversationId(data.conversationId);
      setMessages((m) => [...m, { role: 'assistant', texte: data.reponse }]);
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

  const nouvelleConversation = () => {
    setMessages([]);
    setConversationId(undefined);
    setErreur(null);
  };

  const suggestions = estParent ? SUGGESTIONS_PARENT : SUGGESTIONS_ELEVE;
  const raccourcis = estParent
    ? ['Expliquez plus simplement', 'Quels débouchés après cette formation ?', 'Quelles autres formations techniques ?']
    : ['Explique plus simplement', 'Quels débouchés après ce métier ?', 'Quelles autres formations techniques ?'];

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
              {estParent ? `Posez vos questions sur les formations techniques pour ${profil.prenom}.` : 'Pose tes questions sur les métiers et formations techniques.'}
            </p>
            <p className="text-sm text-text-secondary mb-4v">
              {estParent
                ? 'Guido vous renseigne sur les métiers techniques, les lycées et les formations au Bénin. Il ne consulte pas le dossier scolaire ni les notes.'
                : 'Guido te renseigne sur les métiers techniques, les lycées et les formations au Bénin. Il ne consulte pas ton dossier scolaire ni tes notes.'}
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
              <div className="bubble-assistant max-w-[85%]">
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
            className={`${CHAMP} resize-none flex-1 min-w-0`}
          />
          <Button type="submit" icon={<Send size={16} aria-hidden="true" />} disabled={envoi || !saisie.trim()} className="shrink-0">
            <span className="hidden sm:inline">Envoyer</span>
            <span className="sr-only sm:hidden">Envoyer</span>
          </Button>
        </form>
        <p className="px-3v md:px-4v pb-1v text-xs text-text-secondary hidden sm:block">Entrée pour envoyer, Maj+Entrée pour revenir à la ligne.</p>
      <div className="px-4v md:px-6v pb-2v flex flex-wrap gap-2v" aria-label="Raccourcis de question">
        {raccourcis.map((question) => <button key={question} type="button" onClick={() => envoyer(question)} disabled={envoi} className="px-3v py-1v rounded-full border border-border-strong text-xs text-text hover:border-primary hover:text-primary disabled:opacity-50">{question}</button>)}
      </div>
      <p className="px-4v md:px-6v pb-3v text-xs text-text-secondary">
        {estParent
          ? "Vérifiez les informations importantes auprès de l'établissement. Guido ne consulte pas le dossier scolaire de votre enfant."
          : "Vérifie les informations importantes auprès de ton établissement. Guido ne consulte pas ton dossier scolaire."}
      </p>
    </section>
  );
}
