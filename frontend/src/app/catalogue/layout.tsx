import type { ReactNode } from 'react';
import { BarreComparateur } from '@/components/catalogue/BarreComparateur';

export default function CatalogueLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <BarreComparateur />
    </>
  );
}
