import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.utilisateur.findFirst({
      where: {
        OR: [
          { nip: dto.nip },
          { email: dto.email },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Un compte existe déjà avec ce NIP ou cet email');
    }

    const hash = await bcrypt.hash(dto.motDePasse, 12);

    const user = await this.prisma.utilisateur.create({
      data: {
        nip: dto.nip,
        email: dto.email,
        nom: dto.nom,
        prenom: dto.prenom,
        hashMotDePasse: hash,
        role: (dto.role as any) || 'APPRENANT',
      },
    });

    const tokens = await this.generateTokens(user.id, user.role);
    return {
      user: { id: user.id, nip: user.nip, nom: user.nom, prenom: user.prenom, role: user.role },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.utilisateur.findFirst({
      where: {
        OR: [
          { nip: dto.identifiant },
          { email: dto.identifiant },
        ],
      },
    });

    if (!user || !user.actif) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const valid = await bcrypt.compare(dto.motDePasse, user.hashMotDePasse);
    if (!valid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: { derniereConnexion: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.role);
    return {
      user: { id: user.id, nip: user.nip, nom: user.nom, prenom: user.prenom, role: user.role },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET + '-refresh',
      });

      const session = await this.prisma.session.findUnique({
        where: { refreshToken },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException();
      }

      const user = await this.prisma.utilisateur.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.actif) {
        throw new UnauthorizedException();
      }

      return this.generateTokens(user.id, user.role);
    } catch {
      throw new UnauthorizedException('Refresh token invalide');
    }
  }

  async logout(userId: string) {
    await this.prisma.session.deleteMany({
      where: { utilisateurId: userId },
    });
    return { message: 'Déconnexion réussie' };
  }

  private async generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET + '-refresh',
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await this.prisma.session.create({
      data: {
        utilisateurId: userId,
        token: accessToken,
        refreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}
