import type { ReactNode } from 'react';
import { RequireAuth } from '@/components/auth/RequireAuth';

export default function StatsLayout({ children }: { children: ReactNode }) {
  return <RequireAuth roles={['DGES', 'ADMIN']}>{children}</RequireAuth>;
}
