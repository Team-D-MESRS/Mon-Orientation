import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UtilisateurConnecte } from './utilisateur-courant.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService, config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; role: string }): Promise<UtilisateurConnecte> {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.actif) {
      throw new UnauthorizedException();
    }

    return { id: user.id, nip: user.nip, role: user.role, nom: user.nom, prenom: user.prenom };
  }
}
