import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

/**
 * EducMaster fait foi pour l'identité des élèves et de leurs parents (SPEC §5.6) : sur cette
 * plateforme, on ne crée pas de compte, on s'identifie avec ses identifiants EducMaster.
 *
 * L'API n'étant pas encore ouverte au projet, le mode « fictif » rejoue un annuaire à partir des
 * données locales, pour développer et tester sans elle. Il est refusé en production.
 *
 * Le rattachement des parents est provisoire (décision du 16/09, à revoir) : il est isolé ici pour
 * qu'en changer ne touche qu'un seul endroit.
 */
export interface CompteEducMaster {
  role: 'APPRENANT' | 'PARENT';
  nom: string;
  prenom: string;
  /** Élève : son NIP. Parent : null. */
  nip: string | null;
  /** Élève : son numéro sur les documents officiels, s'il est connu. */
  numeroEducmaster: string | null;
  /** Parent : son adresse. Élève : null. */
  email: string | null;
}

const ROLES_EDUCMASTER = ['APPRENANT', 'PARENT'];

@Injectable()
export class EducMasterService {
  private readonly mode: string;

  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    this.mode = config.get<string>('EDUCMASTER_MODE', 'fictif');
    if (this.estFictif && config.get<string>('NODE_ENV') === 'production') {
      throw new Error("EDUCMASTER_MODE=fictif est interdit en production : branchez l'API EducMaster");
    }
  }

  get estFictif() {
    return this.mode !== 'api';
  }

  /**
   * Vérifie des identifiants EducMaster : NIP ou numéro EducMaster pour un élève, adresse pour un
   * parent. Renvoie l'identité attestée, ou null si les identifiants sont refusés.
   */
  async verifier(identifiant: string, motDePasse: string): Promise<CompteEducMaster | null> {
    if (!this.estFictif) {
      throw new ServiceUnavailableException("La connexion à EducMaster n'est pas encore disponible.");
    }
    return (await this.eleveFictif(identifiant, motDePasse)) ?? (await this.parentFictif(identifiant, motDePasse));
  }

  private async eleveFictif(identifiant: string, motDePasse: string): Promise<CompteEducMaster | null> {
    const apprenant = await this.prisma.apprenant.findFirst({
      where: { OR: [{ nip: identifiant }, { numeroEducmaster: identifiant }] },
      include: { utilisateur: { select: { hashMotDePasse: true, actif: true } } },
    });
    if (!apprenant) return null;

    // Un élève qui s'est déjà identifié a un mot de passe ; sinon, comme sur les documents
    // officiels du ministère, sa date de naissance atteste que le dossier est bien le sien.
    const accepte = apprenant.utilisateur
      ? apprenant.utilisateur.actif && (await bcrypt.compare(motDePasse, apprenant.utilisateur.hashMotDePasse))
      : motDePasse === apprenant.dateNaissance.toISOString().slice(0, 10);
    if (!accepte) return null;

    return {
      role: 'APPRENANT',
      nom: apprenant.nom,
      prenom: apprenant.prenom,
      nip: apprenant.nip,
      numeroEducmaster: apprenant.numeroEducmaster,
      email: null,
    };
  }

  private async parentFictif(identifiant: string, motDePasse: string): Promise<CompteEducMaster | null> {
    const parent = await this.prisma.utilisateur.findFirst({ where: { email: identifiant, role: 'PARENT' } });
    if (!parent || !parent.actif || !(await bcrypt.compare(motDePasse, parent.hashMotDePasse))) return null;
    return {
      role: 'PARENT',
      nom: parent.nom,
      prenom: parent.prenom,
      nip: null,
      numeroEducmaster: null,
      email: parent.email,
    };
  }

  static estRoleEducMaster(role: string) {
    return ROLES_EDUCMASTER.includes(role);
  }
}
