import type { ReactNode } from 'react';
import { RequireAuth } from '@/components/auth/RequireAuth';

export default function EspaceApprenantLayout({ children }: { children: ReactNode }) {
  return <RequireAuth roles={['APPRENANT', 'PARENT', 'ADMIN']}>{children}</RequireAuth>;
}
