import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CompteEducMaster, EducMasterService } from '../educmaster/educmaster.service';
import { IdentificationDto, PersonnelDto } from './dto/auth.dto';

/** Comptes internes à la plateforme, hors EducMaster : ils passent par la route « personnel ». */
const ROLES_PERSONNEL: Role[] = ['ADMIN', 'DGES', 'ETABLISSEMENT'];

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;
  private readonly refreshExpiration: string;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private educmaster: EducMasterService,
    config: ConfigService,
  ) {
    this.refreshSecret = config.get<string>('JWT_REFRESH_SECRET') ?? `${config.getOrThrow<string>('JWT_SECRET')}-refresh`;
    this.refreshExpiration = config.get<string>('JWT_REFRESH_EXPIRATION', '7d');
  }

  /**
   * Identification d'un élève ou d'un parent avec ses identifiants EducMaster. Il n'y a pas
   * d'inscription : c'est EducMaster qui atteste de l'identité, et le compte local est créé à la
   * première identification pour porter la session et les vœux.
   */
  async identification(dto: IdentificationDto) {
    const compte = await this.educmaster.verifier(dto.identifiant.trim(), dto.motDePasse);
    if (!compte) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    const user = compte.role === 'APPRENANT' ? await this.compteEleve(compte, dto.motDePasse) : await this.compteParent(compte);
    return this.session(user);
  }

  /** Personnels du ministère : compte interne à la plateforme, sans lien avec EducMaster. */
  async identificationPersonnel(dto: PersonnelDto) {
    const user = await this.prisma.utilisateur.findFirst({ where: { email: dto.identifiant.trim() } });
    if (!user || !user.actif || !ROLES_PERSONNEL.includes(user.role)) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    if (!(await bcrypt.compare(dto.motDePasse, user.hashMotDePasse))) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    return this.session(user);
  }

  /** Compte local de l'élève, créé à la première identification et rattaché à son dossier. */
  private async compteEleve(compte: CompteEducMaster, motDePasse: string) {
    const nip = compte.nip as string;
    const existant = await this.prisma.utilisateur.findUnique({ where: { nip } });
    if (existant) {
      if (!existant.actif) throw new UnauthorizedException('Identifiants invalides');
      return existant;
    }
    const hash = await bcrypt.hash(motDePasse, 12);
    return this.prisma.$transaction(async (tx) => {
      const cree = await tx.utilisateur.create({
        data: { nip, nom: compte.nom, prenom: compte.prenom, hashMotDePasse: hash, role: 'APPRENANT' },
      });
      await tx.apprenant.update({ where: { nip }, data: { utilisateurId: cree.id } });
      return cree;
    });
  }

  private async compteParent(compte: CompteEducMaster) {
    const user = await this.prisma.utilisateur.findFirst({ where: { email: compte.email as string, role: 'PARENT' } });
    if (!user || !user.actif) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    return user;
  }

  private async session(user: { id: string; nip: string | null; nom: string; prenom: string; role: Role }) {
    await this.prisma.utilisateur.update({ where: { id: user.id }, data: { derniereConnexion: new Date() } });
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
        apprenant: { select: { nip: true, nom: true, prenom: true, palier: true, serie: true } },
        parentLinks: { select: { relation: true, apprenant: { select: { nip: true, nom: true, prenom: true, palier: true, serie: true } } } },
      },
    });
    if (!user) throw new UnauthorizedException();

    const { parentLinks, ...profil } = user;
    return {
      ...profil,
      enfants: parentLinks.map((lien) => ({ ...lien.apprenant, relation: lien.relation })),
    };
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
