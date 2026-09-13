import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UtilisateurConnecte } from './utilisateur-courant.decorator';

/**
 * Autorise l'accès au dossier de l'apprenant `:nip` à l'apprenant lui-même, à un parent
 * rattaché ou à un administrateur. À placer après AuthGuard('jwt').
 *
 * Les autres rôles (DGES, établissement) n'ont pas accès aux dossiers individuels.
 */
@Injectable()
export class AccesApprenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as UtilisateurConnecte | undefined;
    const nip: string | undefined = req.params.nip;
    if (!user || !nip) throw new ForbiddenException();

    const apprenant = await this.prisma.apprenant.findUnique({
      where: { nip },
      select: {
        utilisateurId: true,
        parentLinks: { where: { parentUserId: user.id }, select: { id: true } },
      },
    });

    if (user.role === 'ADMIN') {
      if (!apprenant) throw new NotFoundException('Apprenant non trouvé');
      return true;
    }

    const autorise =
      !!apprenant &&
      ((user.role === 'APPRENANT' && apprenant.utilisateurId === user.id) ||
        (user.role === 'PARENT' && apprenant.parentLinks.length > 0));
    if (!autorise) {
      throw new ForbiddenException("Vous n'avez pas accès à ce dossier");
    }
    return true;
  }
}
