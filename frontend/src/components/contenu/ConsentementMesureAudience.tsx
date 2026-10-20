'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

const CLE_CONSENTEMENT = 'mon-orientation-mesure-audience-v1';

export function ConsentementMesureAudience() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    try { setVisible(window.localStorage.getItem(CLE_CONSENTEMENT) === null); }
    catch { setVisible(false); }
    const rouvrir = () => setVisible(true);
    window.addEventListener('mon-orientation:preferences-audience', rouvrir);
    return () => window.removeEventListener('mon-orientation:preferences-audience', rouvrir);
  }, []);

  function choisir(valeur: 'oui' | 'non') {
    try { window.localStorage.setItem(CLE_CONSENTEMENT, valeur); }
    catch { /* Si le stockage est bloqué, aucun suivi n’est activé. */ }
    finally { setVisible(false); }
  }
  if (!visible) return null;
  return (
    <aside className="fixed z-[70] bottom-3v left-3v right-3v md:left-auto md:right-5v md:bottom-5v md:max-w-xl rounded-bj-md border border-border bg-surface p-4v shadow-xl" aria-label="Choix de mesure d’audience">
      <p className="font-semibold">Mesure d’audience facultative</p>
      <p className="text-sm text-text-secondary mt-1v">Avec ton accord, nous comptons quelques actions (recherche, consultation d’une fiche, usage de Guido) pour améliorer le service. Nous n’enregistrons ni ton compte, ni les mots recherchés, ni les messages envoyés à Guido. Tu peux refuser sans limiter l’accès au site.</p>
      <div className="flex flex-wrap gap-2v mt-3v">
        <Button size="sm" onClick={() => choisir('oui')}>Accepter</Button>
        <Button size="sm" variant="secondary" onClick={() => choisir('non')}>Refuser</Button>
      </div>
    </aside>
  );
}

export function PreferencesMesureAudience() {
  return <Button size="sm" variant="secondary" onClick={() => window.dispatchEvent(new Event('mon-orientation:preferences-audience'))}>Gérer mon choix de mesure d’audience</Button>;
}
