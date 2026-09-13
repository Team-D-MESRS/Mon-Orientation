import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;
  private readonly refreshExpiration: string;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    config: ConfigService,
  ) {
    this.refreshSecret = config.get<string>('JWT_REFRESH_SECRET') ?? `${config.getOrThrow<string>('JWT_SECRET')}-refresh`;
    this.refreshExpiration = config.get<string>('JWT_REFRESH_EXPIRATION', '7d');
  }

  async register(dto: RegisterDto) {
    const role = (dto.role ?? 'APPRENANT') as Role;

    const identifiants: { nip?: string; email?: string }[] = [];
    if (dto.nip) identifiants.push({ nip: dto.nip });
    if (dto.email) identifiants.push({ email: dto.email });
    if (identifiants.length > 0) {
      const existing = await this.prisma.utilisateur.findFirst({ where: { OR: identifiants } });
      if (existing) {
        throw new ConflictException('Un compte existe déjà avec ce NIP ou cet email');
      }
    }

    // En attendant l'authentification EducMaster, l'apprenant prouve que le NIP est le sien
    // avec sa date de naissance ; un dossier ne peut être rattaché qu'à un seul compte.
    if (role === 'APPRENANT') {
      const apprenant = await this.prisma.apprenant.findUnique({ where: { nip: dto.nip } });
      if (!apprenant || apprenant.utilisateurId || !this.memeDate(apprenant.dateNaissance, dto.dateNaissance)) {
        throw new BadRequestException('NIP ou date de naissance incorrects, ou compte déjà créé pour ce NIP');
      }
    }

    const hash = await bcrypt.hash(dto.motDePasse, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const cree = await tx.utilisateur.create({
        data: {
          nip: role === 'APPRENANT' ? dto.nip : null,
          email: dto.email,
          nom: dto.nom,
          prenom: dto.prenom,
          hashMotDePasse: hash,
          role,
        },
      });
      if (role === 'APPRENANT') {
        await tx.apprenant.update({ where: { nip: dto.nip }, data: { utilisateurId: cree.id } });
      }
      return cree;
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

  /** Échange un refresh token contre une nouvelle paire ; l'ancien refresh token est révoqué (rotation). */
  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(refreshToken, { secret: this.refreshSecret });
    } catch {
      throw new UnauthorizedException('Refresh token invalide');
    }

    const session = await this.prisma.session.findUnique({ where: { refreshToken } });
    if (!session || session.expiresAt < new Date() || session.utilisateurId !== payload.sub) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    const user = await this.prisma.utilisateur.findUnique({ where: { id: payload.sub } });
    if (!user || !user.actif) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    await this.prisma.session.delete({ where: { id: session.id } });
    return this.generateTokens(user.id, user.role);
  }

  async logout(userId: string) {
    await this.prisma.session.deleteMany({
      where: { utilisateurId: userId },
    });
    return { message: 'Déconnexion réussie' };
  }

  /** Profil de l'utilisateur connecté et dossiers apprenants auxquels il a accès. */
  async moi(userId: string) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nip: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        apprenant: { select: { nip: true, nom: true, prenom: true } },
        parentLinks: { select: { relation: true, apprenant: { select: { nip: true, nom: true, prenom: true } } } },
      },
    });
    if (!user) throw new UnauthorizedException();

    const { parentLinks, ...profil } = user;
    return {
      ...profil,
      enfants: parentLinks.map((lien) => ({ ...lien.apprenant, relation: lien.relation })),
    };
  }

  private memeDate(date: Date, iso?: string) {
    return !!iso && date.toISOString().slice(0, 10) === iso.slice(0, 10);
  }

  private async generateTokens(userId: string, role: Role) {
    const payload = { sub: userId, role };

    // jti : deux jetons émis dans la même seconde restent distincts (token et refreshToken sont uniques en base)
    const accessToken = this.jwtService.sign({ ...payload, jti: randomUUID() });
    const refreshToken = this.jwtService.sign(
      { ...payload, jti: randomUUID() },
      { secret: this.refreshSecret, expiresIn: this.refreshExpiration },
    );

    const { exp } = this.jwtService.decode(refreshToken) as { exp: number };

    await this.prisma.session.create({
      data: {
        utilisateurId: userId,
        token: accessToken,
        refreshToken,
        expiresAt: new Date(exp * 1000),
      },
    });

    return { accessToken, refreshToken };
  }
}
