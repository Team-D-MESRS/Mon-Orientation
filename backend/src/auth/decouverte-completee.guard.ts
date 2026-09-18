import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UtilisateurConnecte } from './utilisateur-courant.decorator';

/**
 * Verrou serveur (défense en profondeur, décision du 18/09/2026) : interdit la saisie des vœux et
 * le calcul des recommandations tant que le dossier `:nip` n'a pas de questionnaire de découverte.
 * Le mur frontend (MurDecouverte) couvre déjà ce cas pour la navigation normale ; ce guard protège
 * contre un appel direct à l'API qui le contournerait. À placer après AuthGuard('jwt') et
 * AccesApprenantGuard (dont il réutilise l'accès déjà vérifié, sans revalider les droits).
 */
@Injectable()
export class DecouverteCompleteeGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as UtilisateurConnecte | undefined;
    const nip: string | undefined = req.params.nip;
    if (user?.role === 'ADMIN') return true;

    const decouverte = await this.prisma.decouverte.findUnique({
      where: { apprenantNip: nip },
      select: { apprenantNip: true },
    });
    if (!decouverte) {
      throw new ForbiddenException('Le questionnaire de découverte doit être complété avant cette action.');
    }
    return true;
  }
}
