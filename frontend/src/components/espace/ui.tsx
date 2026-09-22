import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react';
import { TYPE_LABELS, TYPE_TONES, type TypeFiliere } from '@/lib/filiere';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { TONS } from '@/components/ui/tons';

/**
 * Composants partagés propres à l'espace apprenant/parent/admin. Les primitives génériques (Card, Badge,
 * StatusPill, ProgressBar…) vivent dans components/ui/ ; celles-ci les habillent pour ce contexte métier
 * précis, et restent exportées sous leur nom d'origine pour ne rien casser des imports existants.
 */

export const CHAMP =
  'w-full px-4v py-3v border border-border-strong rounded-bj-sm text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary';

/** Attente courte en ligne. Alias de LoadingState (components/ui/), conservé sous ce nom pour tous ses appelants existants. */
export function Chargement({ texte }: { texte?: string }) {
  return <LoadingState text={texte} />;
}

type TonAlerte = 'info' | 'succes' | 'attention' | 'erreur';

const ROLE_PAR_TON: Record<TonAlerte, 'note' | 'status' | 'alert'> = {
  info: 'note',
  succes: 'status',
  attention: 'note',
  erreur: 'alert',
};

const ICONE_PAR_TON: Record<TonAlerte, LucideIcon> = {
  info: Info,
  succes: CheckCircle2,
  attention: AlertTriangle,
  erreur: XCircle,
};

/** Message contextuel (info / succès / attention / erreur), couleurs d'état DSBJ — voir components/ui/tons.ts. */
export function Alerte({ ton, children }: { ton: TonAlerte; children: ReactNode }) {
  const { fond, bordure, texte } = TONS[ton];
  const Icone = ICONE_PAR_TON[ton];
  return (
    <div role={ROLE_PAR_TON[ton]} className={`flex gap-3v items-start p-4v my-4v rounded-bj-sm border text-sm alerte-entree ${fond} ${bordure}`}>
      <Icone size={18} className={`shrink-0 mt-[2px] ${texte}`} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

/** Étiquette de type de formation (Général / Technique / Professionnel…). */
export function BadgeType({ type }: { type: TypeFiliere }) {
  return <Badge ton={TYPE_TONES[type]}>{TYPE_LABELS[type]}</Badge>;
}

/** Panneau de contenu avec titre en petites capitales et icône (sections du tableau de bord). */
export function Carte({ titre, icone, children, className }: { titre: string; icone: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <h2 className="flex items-center gap-2v text-sm font-bold uppercase tracking-wide text-text-secondary mb-4v">
        <span className="text-primary" aria-hidden="true">
          {icone}
        </span>
        {titre}
      </h2>
      {children}
    </Card>
  );
}

export function PastilleRang({ rang }: { rang: number }) {
  return (
    <span className="w-8 h-8 rounded-full bg-primary text-text-on-primary flex items-center justify-center font-bold shrink-0" aria-hidden="true">
      {rang}
    </span>
  );
}
