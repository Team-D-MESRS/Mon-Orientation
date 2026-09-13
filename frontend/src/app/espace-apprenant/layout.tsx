import type { ReactNode } from 'react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { CadreEspace } from '@/components/espace/CadreEspace';
import { EspaceProvider } from '@/components/espace/EspaceContext';

export default function EspaceApprenantLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth roles={['APPRENANT', 'PARENT', 'ADMIN']}>
      <EspaceProvider>
        <CadreEspace>{children}</CadreEspace>
      </EspaceProvider>
    </RequireAuth>
  );
}
