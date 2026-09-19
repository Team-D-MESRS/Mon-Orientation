'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useVisiteGuideeStore } from '@/stores/visiteGuideeStore';
import { useEspace } from './EspaceContext';

/**
 * Une étape par onglet de CadreEspace (même hrefs que ONGLETS, volontairement dupliqué plutôt que
 * partagé : le texte de la visite est un souci d'onboarding, pas de navigation).
 */
const ETAPES: { href: string; texte: string }[] = [
  { href: '/espace-apprenant', texte: 'Ton tableau de bord résume tes notes et tes pistes, dès que tu te connectes.' },
  { href: '/espace-apprenant/decouverte', texte: 'Le questionnaire de découverte pose quelques questions pour savoir ce qui te plaît.' },
  { href: '/espace-apprenant/notes', texte: 'Retrouve ici les notes envoyées par ton établissement, matière par matière.' },
  { href: '/espace-apprenant/preferences', texte: "Choisis les formations qui t'intéressent, classées par ordre de préférence." },
  { href: '/espace-apprenant/recommandations', texte: 'Découvre les formations qui correspondent le mieux à ton profil et à tes résultats.' },
  { href: '/espace-apprenant/conseiller', texte: 'Pose tes questions à Guido à tout moment, à l’écrit ou à l’oral.' },
];

const CLASSE_MISE_EN_EVIDENCE = ['ring-2', 'ring-bj-green', 'ring-offset-2'];

const cleStorage = (userId: string) => `visite-guidee:${userId}`;

/**
 * Tournée guidée à la 1re visite de l'espace apprenant : une bulle par onglet, lue à voix haute
 * par défaut (synthèse vocale du navigateur, français uniquement — aucune voix native pour le
 * fongbé, le yoruba ou le mina). Cible les onglets de CadreEspace via l'attribut `data-tour`.
 */
export function VisiteGuidee() {
  const userId = useAuthStore((s) => s.user?.id);
  const { moi } = useEspace();
  const estAdmin = moi.role === 'ADMIN';
  const relance = useVisiteGuideeStore((s) => s.relance);
  const consommerRelance = useVisiteGuideeStore((s) => s.consommerRelance);

  const [actif, setActif] = useState(false);
  const [etape, setEtape] = useState(0);
  const [coupe, setCoupe] = useState(false);
  const demarre = useRef(false);

  const marquerVue = () => {
    if (!userId) return;
    try {
      localStorage.setItem(cleStorage(userId), '1');
    } catch {
      /* stockage indisponible (navigation privée…) : tant pis, la tournée se represente */
    }
  };
  const terminer = () => {
    marquerVue();
    setActif(false);
  };
  const suivant = () => {
    if (etape < ETAPES.length - 1) setEtape((e) => e + 1);
    else terminer();
  };
  const precedent = () => setEtape((e) => Math.max(0, e - 1));
  const basculerSon = () => {
    if (!coupe && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setCoupe((c) => !c);
  };

  // Déclenchement : une fois par compte (flag localStorage), ou à tout moment sur demande de
  // relance depuis le header (« Revoir la visite guidée »), même si déjà vue.
  useEffect(() => {
    if (!userId || estAdmin) return;
    if (relance) {
      consommerRelance();
      setEtape(0);
      setCoupe(false);
      setActif(true);
      demarre.current = true;
      return;
    }
    if (demarre.current) return;
    demarre.current = true;
    let vue = false;
    try {
      vue = localStorage.getItem(cleStorage(userId)) === '1';
    } catch {
      /* stockage indisponible : on considère que ce n'est pas encore vu */
    }
    if (!vue) setActif(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, estAdmin, relance]);

  // Mise en évidence de l'onglet courant + lecture à voix haute, à chaque étape.
  useEffect(() => {
    if (!actif) return;
    document.querySelectorAll('[data-tour]').forEach((el) => el.classList.remove(...CLASSE_MISE_EN_EVIDENCE));
    const cible = document.querySelector(`[data-tour="${ETAPES[etape].href}"]`);
    if (cible) {
      cible.classList.add(...CLASSE_MISE_EN_EVIDENCE);
      cible.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    if (!coupe && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(ETAPES[etape].texte);
      u.lang = 'fr-FR';
      window.speechSynthesis.speak(u);
    }
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [actif, etape, coupe]);

  // Retire la mise en évidence en sortant de la tournée.
  useEffect(() => {
    if (actif) return;
    document.querySelectorAll('[data-tour]').forEach((el) => el.classList.remove(...CLASSE_MISE_EN_EVIDENCE));
  }, [actif]);

  // Réserve de la place en bas de page pendant la tournée : sans ça, le bandeau fixe peut recouvrir
  // un bouton de formulaire si l'utilisateur navigue vers un autre onglet (Vœux, Découverte…) sans
  // attendre la fin des 6 étapes.
  useEffect(() => {
    document.body.style.paddingBottom = actif ? '132px' : '';
    return () => {
      document.body.style.paddingBottom = '';
    };
  }, [actif]);

  // Échap ferme la tournée, comme un dialogue classique.
  useEffect(() => {
    if (!actif) return;
    const surEchap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        marquerVue();
        setActif(false);
      }
    };
    window.addEventListener('keydown', surEchap);
    return () => window.removeEventListener('keydown', surEchap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actif]);

  if (!actif) return null;
  const donneeEtape = ETAPES[etape];
  const dernier = etape === ETAPES.length - 1;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Visite guidée de l'espace apprenant"
      className="fixed bottom-0 inset-x-0 z-[60] bg-white border-t border-bj-gray-925 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]"
    >
      <div className="bj-container py-4v">
        <div className="flex items-start gap-3v">
          <button
            type="button"
            onClick={basculerSon}
            aria-pressed={coupe}
            aria-label={coupe ? 'Réactiver la lecture automatique' : 'Couper la lecture automatique'}
            className="shrink-0 w-11 h-11 rounded-full bg-bj-green/10 text-bj-green flex items-center justify-center"
          >
            {coupe ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-bj-green mb-1v">
              Étape {etape + 1} sur {ETAPES.length}
            </p>
            <div className="h-1.5 rounded-full bg-bj-gray-925 overflow-hidden mb-2v max-w-xs" role="progressbar" aria-valuemin={0} aria-valuemax={ETAPES.length} aria-valuenow={etape + 1}>
              <div className="h-full bg-bj-green transition-all" style={{ width: `${((etape + 1) / ETAPES.length) * 100}%` }} />
            </div>
            <p className="text-sm">{donneeEtape.texte}</p>
          </div>

          <button type="button" onClick={terminer} aria-label="Fermer la visite guidée" className="shrink-0 text-bj-gray-500 hover:text-bj-gray-200 p-1v">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3v gap-y-2v mt-3v">
          <button type="button" onClick={terminer} className="text-sm font-medium text-bj-gray-500 hover:underline whitespace-nowrap">
            Passer la visite
          </button>
          <div className="flex gap-2v ml-auto">
            <button type="button" onClick={precedent} disabled={etape === 0} className="bj-btn bj-btn-secondary text-sm disabled:opacity-40">
              ← Précédent
            </button>
            <button type="button" onClick={suivant} className="bj-btn bj-btn-primary text-sm">
              {dernier ? 'Terminer' : 'Suivant →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
