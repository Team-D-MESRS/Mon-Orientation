import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

export interface UtilisateurConnecte {
  id: string;
  nip: string | null;
  role: Role;
  nom: string;
  prenom: string;
}

export const UtilisateurCourant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UtilisateurConnecte => ctx.switchToHttp().getRequest().user,
);
