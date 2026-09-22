import type { ElementType, ReactNode } from 'react';

interface SectionHeaderProps {
  /** Petit libellé au-dessus du titre (ex. « Mon Orientation · Première étape ») */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Lien ou bouton affiché à droite du titre (ex. « Tout voir → ») */
  action?: ReactNode;
  as?: ElementType;
  /** Titre en Spectral plutôt qu'en Montserrat : réservé aux moments « display » (accueil, en-tête d'espace). */
  serif?: boolean;
  id?: string;
  className?: string;
}

const TAILLE_PAR_NIVEAU: Record<string, string> = {
  h1: 'text-3xl md:text-4xl',
  h2: 'text-2xl md:text-3xl',
  h3: 'text-xl',
};

/**
 * En-tête de section réutilisable : éventuel eyebrow, titre, sous-titre, action alignée à droite sur grand
 * écran (empilée en dessous sur mobile). Remplace les `<h2 className="text-xl font-bold">…</h2>` répétés
 * avec un lien « Tout voir » à côté, homogénéise l'accueil (TitreSection), le tableau de bord et l'admin.
 */
export function SectionHeader({ eyebrow, title, subtitle, action, as = 'h2', serif, id, className }: SectionHeaderProps) {
  const Titre = as as ElementType;
  const taille = TAILLE_PAR_NIVEAU[typeof as === 'string' ? as : 'h2'] ?? TAILLE_PAR_NIVEAU.h2;
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3v ${className ?? ''}`}>
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary mb-1v">{eyebrow}</p>}
        <Titre id={id} className={`font-bold ${taille} ${serif ? 'font-serif' : ''}`}>
          {title}
        </Titre>
        {subtitle && <p className="text-text-secondary mt-1v">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
