'use client';

import { useEffect, useState } from 'react';
import { Check, Link2, Printer, Send, Share2 } from 'lucide-react';

const BOUTON =
  'inline-flex items-center gap-1v px-3v py-2v rounded-bj-sm border border-bj-gray-850 bg-white text-sm font-medium text-bj-gray-200 hover:border-bj-green hover:text-bj-green focus:outline-none focus-visible:ring-2 focus-visible:ring-bj-green';

/** Copie sans l'API Presse-papiers (indisponible hors HTTPS) */
function copierAncienneMethode(texte: string) {
  const zone = document.createElement('textarea');
  zone.value = texte;
  zone.setAttribute('readonly', '');
  zone.style.position = 'fixed';
  zone.style.opacity = '0';
  document.body.appendChild(zone);
  zone.select();
  const ok = document.execCommand('copy');
  zone.remove();
  return ok;
}

/** Partage de la page affichée : WhatsApp, partage du téléphone, copie du lien, impression. */
export function Partage({ titre }: { titre: string }) {
  const [url, setUrl] = useState('');
  const [partageNatif, setPartageNatif] = useState(false);
  const [copie, setCopie] = useState<'ok' | 'echec' | null>(null);

  // L'adresse n'est connue que dans le navigateur ; elle change avec la sélection du comparateur
  useEffect(() => {
    setUrl(window.location.href);
    setPartageNatif(typeof navigator.share === 'function');
  }, [titre]);

  useEffect(() => {
    if (!copie) return;
    const minuteur = setTimeout(() => setCopie(null), 3000);
    return () => clearTimeout(minuteur);
  }, [copie]);

  const texte = `${titre} — Mon Orientation`;

  const copier = async () => {
    const adresse = window.location.href;
    try {
      await navigator.clipboard.writeText(adresse);
      setCopie('ok');
    } catch {
      setCopie(copierAncienneMethode(adresse) ? 'ok' : 'echec');
    }
  };

  return (
    <div role="group" aria-label="Partager" className="flex flex-wrap items-center gap-2v print:hidden">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${texte}\n${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={BOUTON}
      >
        <Send size={16} aria-hidden="true" /> WhatsApp
      </a>
      {partageNatif && (
        <button
          type="button"
          className={BOUTON}
          onClick={() => navigator.share({ title: texte, url: window.location.href }).catch(() => undefined)}
        >
          <Share2 size={16} aria-hidden="true" /> Partager
        </button>
      )}
      <button type="button" className={BOUTON} onClick={copier}>
        {copie === 'ok' ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
        {copie === 'ok' ? 'Lien copié' : 'Copier le lien'}
      </button>
      <button type="button" className={BOUTON} onClick={() => window.print()}>
        <Printer size={16} aria-hidden="true" /> Imprimer
      </button>
      <span aria-live="polite" className={copie === 'echec' ? 'text-xs text-bj-red' : 'sr-only'}>
        {copie === 'ok' ? 'Lien copié.' : copie === 'echec' ? "Copie impossible : copie l'adresse depuis la barre du navigateur." : ''}
      </span>
    </div>
  );
}
