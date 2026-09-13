import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Compte les requêtes par compte connecté. Pour le conseiller, cela borne le coût du modèle de langage
 * et les abus ; l'IP ne convient pas, les établissements partageant souvent une même connexion.
 * À placer après AuthGuard('jwt').
 */
@Injectable()
export class ThrottlerUtilisateurGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.id ?? req.ip;
  }
}
