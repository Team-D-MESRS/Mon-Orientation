import Link from 'next/link';
import type { ReactNode } from 'react';
import { StatCard, type StatCardTone } from '@/components/ui/StatCard';

interface DashboardStatProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  /** Rend toute la tuile cliquable, vers le détail de cette métrique. */
  href?: string;
  tone?: StatCardTone;
}

/** Tuile chiffre-clé du tableau de bord (habille StatCard) : jamais de métrique inventée, toujours un vrai nombre issu des données déjà chargées par la page. */
export function DashboardStat({ icon, label, value, hint, href, tone = 'brand' }: DashboardStatProps) {
  const contenu = <StatCard icon={icon} label={label} value={value} hint={hint} tone={tone} />;
  if (!href) return contenu;
  return (
    <Link
      href={href}
      className="block rounded-bj-md transition-transform hover:-translate-y-0.5"
      aria-label={`${label} : ${value}${hint ? `, ${hint}` : ''}`}
    >
      {contenu}
    </Link>
  );
}
