'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { X, Send, RotateCcw, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { authApi, conseillerApi, type Moi } from '@/lib/api';
import { messageErreur } from '@/lib/erreurs';
import { useAuthStore } from '@/stores/authStore';
import { TexteConseiller } from '@/components/espace/TexteConseiller';

interface Message {
  role: 'user' | 'assistant';
  texte: string;
}

const QUESTIONS_ELEVE = [
  'Quelles formations techniques après le BEPC ?',
  'Quels métiers techniques pourrais-je découvrir ?',
  'Quels débouchés après une formation agricole ?',
];
const QUESTIONS_PARENT = [
  'Quelles formations techniques après le BEPC ?',
  'Quels métiers techniques pourraient intéresser mon enfant ?',
  'Quels débouchés après une formation agricole ?',
];

function messageErreurGuido(err: unknown): string {
  if (axios.isAxiosError(err) && (err.response?.status === 429 || err.response?.status === 503)) {
    const message = (err.response.data as { message?: string } | undefined)?.message;
    if (message) return message;
  }
  return messageErreur(err);
}

/** Accès flottant global à Guido. Le bot reste soumis aux mêmes rôles et routes que l’espace apprenant. */
export function GuidoWidget() {
  const { user, pret } = useAuthStore();
  const [ouvert, setOuvert] = useState(false);
  const [enfants, setEnfants] = useState<Moi['enfants']>([]);
  const [nip, setNip] = useState('');
  const [chargementEnfants, setChargementEnfants] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [saisie, setSaisie] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const boutonRef = useRef<HTMLButtonElement>(null);
  const panneauRef = useRef<HTMLDivElement>(null);
  const saisieRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const estEleve = user?.role === 'APPRENANT';
  const estParent = user?.role === 'PARENT';
  const autorise = estEleve || estParent;
  const questions = estParent ? QUESTIONS_PARENT : QUESTIONS_ELEVE;
  const enfantChoisi = enfants.find((enfant) => enfant.nip === nip);

  useEffect(() => {
    if (!ouvert || !pret) return;
    if (estEleve) {
      setNip(user?.nip ?? '');
      setEnfants([]);
      setChargementEnfants(false);
      return;
    }
    if (!estParent) {
      setNip('');
      setEnfants([]);
      setChargementEnfants(false);
      return;
    }

    let actif = true;
    setChargementEnfants(true);
    setErreur(null);
    authApi.moi()
      .then(({ data }) => {
        if (!actif) return;
        const enfantsDisponibles = data.enfants.filter((enfant) => !!enfant.nip);
        setEnfants(enfantsDisponibles);
        setNip((nipActuel) => enfantsDisponibles.some((enfant) => enfant.nip === nipActuel)
          ? nipActuel
          : enfantsDisponibles[0]?.nip ?? '');
      })
      .catch((err) => {
        if (actif) setErreur(messageErreurGuido(err));
      })
      .finally(() => {
        if (actif) setChargementEnfants(false);
      });
    return () => { actif = false; };
  }, [ouvert, pret, estEleve, estParent, user?.id, user?.nip]);

  useEffect(() => {
    setMessages([]);
    setConversationId(undefined);
    setErreur(null);
  }, [nip]);

  useEffect(() => {
    if (!ouvert) return;
    const fermerAvecEchap = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOuvert(false);
        boutonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', fermerAvecEchap);
    window.setTimeout(() => {
      if (autorise && nip) saisieRef.current?.focus();
      else panneauRef.current?.focus();
    }, 0);
    return () => document.removeEventListener('keydown', fermerAvecEchap);
  }, [ouvert, autorise, nip]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, envoi]);

  const changerEnfant = (nouveauNip: string) => {
    setNip(nouveauNip);
    setMessages([]);
    setConversationId(undefined);
    setErreur(null);
  };

  const nouvelleConversation = () => {
    setMessages([]);
    setConversationId(undefined);
    setSaisie('');
    setErreur(null);
  };

  const envoyer = async (texte: string) => {
    const question = texte.trim();
    if (!question || envoi || !nip || !autorise) return;
    setErreur(null);
    setMessages((precedents) => [...precedents, { role: 'user', texte: question }]);
    setSaisie('');
    setEnvoi(true);
    try {
      const { data } = await conseillerApi.chat(nip, question, conversationId);
      setConversationId(data.conversationId);
      setMessages((precedents) => [...precedents, { role: 'assistant', texte: data.reponse }]);
    } catch (err) {
      setMessages((precedents) => precedents.slice(0, -1));
      setSaisie(question);
      setErreur(messageErreurGuido(err));
    } finally {
      setEnvoi(false);
    }
  };

  const soumettre = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void envoyer(saisie);
  };

  const toucheClavier = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void envoyer(saisie);
    }
  };

  return (
    <div className="print:hidden">
      {ouvert && (
        <section
          ref={panneauRef}
          id="guido-widget-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="guido-widget-title"
          tabIndex={-1}
          className="fixed z-[60] right-3 bottom-24 sm:right-6 w-[calc(100vw-1.5rem)] max-w-[400px] flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_48px_rgba(21,44,53,0.24)] outline-none"
          style={{ height: 'min(76dvh, 620px)', maxHeight: 'calc(100dvh - 7rem)' }}
        >
          <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-surface-raised">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 shrink-0 rounded-full bg-primary-soft overflow-hidden flex items-center justify-center">
                <Image src="/images/guido-mascotte.webp" alt="" width={44} height={44} className="w-11 h-11 object-contain" priority />
              </div>
              <div className="min-w-0">
                <h2 id="guido-widget-title" className="font-bold text-base leading-tight">Guido</h2>
                <p className="text-xs text-text-secondary truncate">Guide des métiers techniques</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && autorise && (
                <button type="button" onClick={nouvelleConversation} disabled={envoi} aria-label="Nouvelle conversation" title="Nouvelle conversation" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50">
                  <RotateCcw size={17} aria-hidden="true" />
                </button>
              )}
              <button type="button" onClick={() => { setOuvert(false); window.setTimeout(() => boutonRef.current?.focus(), 0); }} aria-label="Fermer Guido" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                <X size={19} aria-hidden="true" />
              </button>
            </div>
          </header>

          {estParent && enfants.length > 1 && (
            <label className="flex items-center gap-2 px-4 py-2 border-b border-border text-xs text-text-secondary">
              <span className="shrink-0">Conversation pour</span>
              <span className="relative flex-1 min-w-0">
                <select value={nip} onChange={(event) => changerEnfant(event.target.value)} disabled={chargementEnfants || envoi} className="w-full appearance-none rounded-lg border border-border-strong bg-surface px-3 py-2 pr-8 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary">
                  {enfants.map((enfant) => <option key={enfant.nip} value={enfant.nip}>{enfant.prenom} {enfant.nom}</option>)}
                </select>
                <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
              </span>
            </label>
          )}

          {!pret ? (
            <div className="flex-1 grid place-items-center p-6 text-sm text-text-secondary" role="status">Chargement de la session…</div>
          ) : !user ? (
            <div className="flex-1 flex flex-col justify-center items-start gap-4 p-6">
              <div className="w-14 h-14 rounded-full bg-primary-soft flex items-center justify-center overflow-hidden">
                <Image src="/images/guido-mascotte.webp" alt="" width={56} height={56} className="w-14 h-14 object-contain" />
              </div>
              <div>
                <p className="font-semibold mb-2">Bonjour, je suis Guido.</p>
                <p className="text-sm text-text-secondary leading-relaxed">Je peux répondre à tes questions générales sur les métiers et les formations techniques au Bénin. Connecte-toi comme élève ou parent pour démarrer une conversation.</p>
              </div>
              <Link href={`/identification?redirect=${encodeURIComponent('/conseiller')}`} onClick={() => setOuvert(false)} className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-text-on-primary hover:bg-primary-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                S&apos;identifier pour discuter
              </Link>
              <p className="text-xs text-text-muted">Ne partage pas d&apos;informations personnelles dans tes questions.</p>
            </div>
          ) : !autorise ? (
            <div className="flex-1 flex flex-col justify-center gap-3 p-6">
              <p className="font-semibold">Guido est réservé aux élèves et à leurs parents.</p>
              <p className="text-sm text-text-secondary">Tu peux découvrir les métiers et formations dans le catalogue.</p>
              <Link href="/catalogue" onClick={() => setOuvert(false)} className="text-sm font-semibold text-primary underline underline-offset-2">Ouvrir le catalogue</Link>
            </div>
          ) : chargementEnfants ? (
            <div className="flex-1 grid place-items-center p-6 text-sm text-text-secondary" role="status">Préparation de la conversation…</div>
          ) : !nip ? (
            <div className="flex-1 grid place-items-center p-6 text-center text-sm text-text-secondary" role="status">
              {estParent ? 'Aucun dossier d’enfant rattaché à ce compte.' : 'Le dossier élève est indisponible.'}
            </div>
          ) : (
            <>
              <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite" aria-relevant="additions text">
                <div className="flex justify-start">
                  <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-surface-sunken px-3.5 py-3 text-sm leading-relaxed">
                    {estParent ? `Bonjour${enfantChoisi ? ` ! Je peux vous aider à découvrir les métiers et formations techniques pour ${enfantChoisi.prenom}` : ' ! Je peux vous aider à découvrir les métiers et formations techniques'}. Posez-moi votre question en français.` : 'Bonjour ! Je peux t’aider à découvrir les métiers et formations techniques au Bénin. Pose ta question en français.'}
                  </div>
                </div>
                {messages.length === 0 && (
                  <div className="flex flex-wrap gap-2 pt-1" aria-label="Suggestions de questions">
                    {questions.map((question) => (
                      <button key={question} type="button" onClick={() => void envoyer(question)} disabled={envoi} className="rounded-full border border-border-strong bg-surface px-3 py-2 text-left text-xs leading-snug hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50">
                        {question}
                      </button>
                    ))}
                  </div>
                )}
                {messages.map((message, index) => (
                  <div key={`${conversationId ?? 'nouvelle'}-${index}`} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div className={message.role === 'user' ? 'max-w-[88%] rounded-2xl rounded-br-md bg-primary px-3.5 py-3 text-sm text-text-on-primary whitespace-pre-wrap' : 'max-w-[92%] rounded-2xl rounded-bl-md bg-surface-sunken px-3.5 py-3 text-sm'}>
                      {message.role === 'assistant' ? <TexteConseiller texte={message.texte} /> : message.texte}
                    </div>
                  </div>
                ))}
                {envoi && <div role="status" className="text-xs text-text-secondary">Guido prépare sa réponse…</div>}
              </div>

              {erreur && <p role="alert" className="mx-4 mb-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-strong">{erreur}</p>}

              <form onSubmit={soumettre} className="border-t border-border p-3 flex items-end gap-2">
                <label htmlFor="guido-widget-question" className="sr-only">{estParent ? 'Votre question à Guido' : 'Ta question à Guido'}</label>
                <textarea
                  ref={saisieRef}
                  id="guido-widget-question"
                  rows={2}
                  maxLength={2000}
                  value={saisie}
                  onChange={(event) => setSaisie(event.target.value)}
                  onKeyDown={toucheClavier}
                  disabled={envoi}
                  placeholder={estParent ? 'Écrivez votre question…' : 'Écris ta question…'}
                  className="min-w-0 flex-1 resize-none rounded-xl border border-border-strong bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                />
                <button type="submit" disabled={envoi || !saisie.trim()} aria-label="Envoyer la question" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-text-on-primary hover:bg-primary-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50">
                  <Send size={17} aria-hidden="true" />
                </button>
              </form>
              <p className="px-4 pb-3 text-[11px] leading-snug text-text-muted">
                {estParent ? 'Votre message et les échanges récents sont transmis au service Guido externe. Ne saisissez pas de données personnelles.' : 'Ta question et les échanges récents sont transmis au service Guido externe. N’écris pas de données personnelles.'}
              </p>
            </>
          )}
        </section>
      )}

      <button
        ref={boutonRef}
        type="button"
        aria-label={ouvert ? 'Fermer Guido' : 'Ouvrir Guido'}
        aria-expanded={ouvert}
        aria-haspopup="dialog"
        aria-controls={ouvert ? 'guido-widget-panel' : undefined}
        onClick={() => setOuvert((etat) => !etat)}
        className="fixed z-[61] bottom-4 right-4 sm:bottom-6 sm:right-6 flex h-[68px] w-[68px] items-center justify-center rounded-full border-[3px] border-surface bg-primary shadow-[0_8px_24px_rgba(21,44,53,0.28)] transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-primary print:hidden"
      >
        {ouvert ? <X size={25} className="text-text-on-primary" aria-hidden="true" /> : <Image src="/images/guido-mascotte.webp" alt="" width={62} height={62} className="h-[62px] w-[62px] object-contain" priority />}
        <span className="absolute -bottom-1 rounded-full border-2 border-surface bg-accent px-2 py-0.5 text-[10px] font-bold leading-none text-text">Guido</span>
      </button>
    </div>
  );
}
