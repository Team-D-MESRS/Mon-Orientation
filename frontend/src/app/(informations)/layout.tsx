import type { ReactNode } from 'react';
import { NavInformations } from '@/components/layout/NavInformations';

/** Pages d'aide et pages légales : navigation commune à gauche (au-dessus sur mobile). */
export default function InformationsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="py-8v">
      <div className="bj-container grid grid-cols-1 lg:grid-cols-[14rem_1fr] gap-8v">
        <NavInformations />
        <article className="min-w-0 max-w-3xl">{children}</article>
      </div>
    </div>
  );
}
