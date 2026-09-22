import type { ReactNode } from 'react';

export type StatCardTone = 'brand' | 'plain';

interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  /** 'brand' : libellé et icône en couleur de marque (indicateurs admin). 'plain' : libellé neutre (tuiles de suivi parent). */
  tone?: StatCardTone;
  className?: string;
}

/** Tuile chiffre-clé (indicateurs admin, suivi parent). Remplace les `function Kpi(...)` redéfinies localement page par page. */
export function StatCard({ icon, label, value, hint, action, tone = 'brand', className }: StatCardProps) {
  return (
    <div className={`bg-surface rounded-bj-md border border-border p-4v ${className ?? ''}`}>
      <div className={`flex items-center gap-2v mb-2v ${tone === 'brand' ? 'text-primary' : 'text-text-secondary'}`}>
        {icon}
        <span className="text-xs uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <p className="text-xl md:text-2xl font-bold text-text">{value}</p>
      {hint && <p className="text-xs text-text-secondary mt-1v">{hint}</p>}
      {action && <div className="mt-1v">{action}</div>}
    </div>
  );
}
