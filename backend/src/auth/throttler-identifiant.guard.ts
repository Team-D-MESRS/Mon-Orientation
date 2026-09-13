import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Compte les tentatives par couple (IP, identifiant) plutôt que par IP seule :
 * dans les établissements, de nombreux élèves partagent la même connexion internet.
 */
@Injectable()
export class ThrottlerIdentifiantGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const identifiant = req.body?.identifiant ?? req.body?.nip ?? req.body?.email;
    return identifiant ? `${req.ip}:${String(identifiant).toLowerCase()}` : req.ip;
  }
}
