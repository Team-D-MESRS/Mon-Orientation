import { TONS, type Ton } from './tons';

interface ProgressBarProps {
  /** 0 à 100 */
  value: number;
  label: string;
  ton?: Ton;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Barre de progression accessible (role="progressbar"). Remplace les
 * `<div className="h-2 rounded-full bg-bj-gray-925 ..."><div style={{width}} /></div>` répétés dans le
 * tableau de bord, le questionnaire de découverte, la fiche filière et les recommandations.
 */
export function ProgressBar({ value, label, ton = 'marque', size = 'md', className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`${size === 'sm' ? 'h-1.5' : 'h-2'} rounded-full bg-surface-sunken overflow-hidden ${className ?? ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-label={label}
    >
      <div className={`h-full rounded-full transition-[width] duration-500 ease-out ${TONS[ton].point}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
