import Link from 'next/link';
import type { ReactNode } from 'react';

// Le texte vient du service Guido : seuls les liens internes connus deviennent cliquables.
const LIEN_INTERNE = /^\/(catalogue\/[0-9a-f-]{36}|espace-apprenant(\/[a-z-]+)?)$/;
const EN_LIGNE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

function enLigne(texte: string, cle: string): ReactNode[] {
  const morceaux: ReactNode[] = [];
  let dernier = 0;
  let i = 0;
  for (const m of Array.from(texte.matchAll(EN_LIGNE))) {
    const debut = m.index ?? 0;
    if (debut > dernier) morceaux.push(texte.slice(dernier, debut));
    if (m[1] !== undefined) {
      morceaux.push(<strong key={`${cle}-${i++}`}>{m[1]}</strong>);
    } else if (LIEN_INTERNE.test(m[3])) {
      morceaux.push(
        <Link key={`${cle}-${i++}`} href={m[3]} className="font-medium text-bj-green underline">
          {m[2]}
        </Link>,
      );
    } else {
      morceaux.push(m[2]);
    }
    dernier = debut + m[0].length;
  }
  if (dernier < texte.length) morceaux.push(texte.slice(dernier));
  return morceaux;
}

/** Affiche une réponse du conseiller : paragraphes, listes à puces, gras et liens internes. Jamais de HTML brut. */
export function TexteConseiller({ texte }: { texte: string }) {
  const blocs: ReactNode[] = [];
  let puces: string[] = [];

  const viderPuces = () => {
    if (puces.length === 0) return;
    const k = blocs.length;
    blocs.push(
      <ul key={`l${k}`} className="list-disc pl-5 space-y-1v">
        {puces.map((p, j) => (
          <li key={j}>{enLigne(p, `l${k}-${j}`)}</li>
        ))}
      </ul>,
    );
    puces = [];
  };

  for (const ligne of texte.split('\n')) {
    const t = ligne.trim();
    const puce = /^[-*•]\s+(.*)$/.exec(t);
    if (puce) {
      puces.push(puce[1]);
      continue;
    }
    viderPuces();
    if (t) {
      const k = blocs.length;
      blocs.push(<p key={`p${k}`}>{enLigne(t.replace(/^#+\s*/, ''), `p${k}`)}</p>);
    }
  }
  viderPuces();

  return <div className="space-y-2v text-sm leading-relaxed">{blocs}</div>;
}
