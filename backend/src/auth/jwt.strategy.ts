import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }

  async validate(payload: { sub: string; role: string }) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.actif) {
      throw new UnauthorizedException();
    }

    return { id: user.id, nip: user.nip, role: user.role, nom: user.nom, prenom: user.prenom };
  }
}
