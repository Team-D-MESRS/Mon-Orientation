/**
 * Tons partagés par Badge, StatusPill et Alerte (components/espace/ui.tsx) : un seul endroit pour la
 * correspondance « ton → couleurs », plutôt qu'une palette redéfinie dans chaque composant. Distingue les
 * tons de marque (marque/accent/terre — identité, à utiliser avec parcimonie) des tons d'état (succes/
 * attention/erreur/info — retour fonctionnel, couleurs DSBJ « fonctionnelles », voir globals.css).
 */
export type Ton = 'neutre' | 'marque' | 'accent' | 'terre' | 'info' | 'succes' | 'attention' | 'erreur';

interface DefinitionTon {
  /** Texte/icône sur fond clair ou blanc — toujours vérifié ≥ 4.5:1 */
  texte: string;
  /** Fond teinté doux (bandeaux, badges) */
  fond: string;
  bordure: string;
  /** Fond plein, texte clair dessus (pastilles de statut fortement marquées) */
  plein: string;
  /** Pastille pleine seule (puce de StatusPill), sans le texte associé */
  point: string;
}

export const TONS: Record<Ton, DefinitionTon> = {
  neutre: { texte: 'text-text-secondary', fond: 'bg-surface-sunken', bordure: 'border-border-strong', plein: 'bg-bj-gray-100 text-text-on-primary', point: 'bg-bj-gray-500' },
  marque: { texte: 'text-primary', fond: 'bg-primary-soft', bordure: 'border-primary/30', plein: 'bg-primary text-text-on-primary', point: 'bg-primary' },
  accent: { texte: 'text-accent-strong', fond: 'bg-accent-soft', bordure: 'border-accent/50', plein: 'bg-accent text-text', point: 'bg-accent' },
  terre: { texte: 'text-terre-strong', fond: 'bg-terre-soft', bordure: 'border-terre/40', plein: 'bg-terre text-text-on-primary', point: 'bg-terre' },
  info: { texte: 'text-info', fond: 'bg-info-soft', bordure: 'border-info/30', plein: 'bg-info text-text-on-primary', point: 'bg-info' },
  succes: { texte: 'text-success', fond: 'bg-success-soft', bordure: 'border-success/30', plein: 'bg-success text-text-on-primary', point: 'bg-success' },
  attention: { texte: 'text-warning-strong', fond: 'bg-warning-soft', bordure: 'border-warning/40', plein: 'bg-warning text-text-on-primary', point: 'bg-warning' },
  erreur: { texte: 'text-danger', fond: 'bg-danger-soft', bordure: 'border-danger/40', plein: 'bg-danger text-text-on-primary', point: 'bg-danger' },
};
