import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  EtatBrouillonAdmin,
  NiveauAcces,
  Prisma,
  StatutPageSite,
  TypeEtablissement,
  TypeFiliere,
  TypeRessourceAdmin,
} from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { DOMAINES } from '../filiere/domaines';

const DOMAINE_CODES = Object.keys(DOMAINES);
const domaineSchema = z.string().refine((value) => DOMAINE_CODES.includes(value), 'Domaine inconnu');
const offreFiliereSchema = z.object({
  etablissementId: z.string().min(1),
  duree: z.string().max(120).nullable().optional(),
  source: z.string().max(1000).default('Modification depuis la console Admin'),
});
const offreEtablissementSchema = z.object({
  filiereId: z.string().min(1),
  duree: z.string().max(120).nullable().optional(),
  source: z.string().max(1000).default('Modification depuis la console Admin'),
});
const filiereSchema = z.object({
  code: z.string().max(100).nullable().optional(),
  nom: z.string().trim().min(2).max(240),
  type: z.nativeEnum(TypeFiliere),
  niveauAcces: z.nativeEnum(NiveauAcces).nullable().optional(),
  description: z.string().max(12000).nullable().optional(),
  diplomesDelivres: z.array(z.string().max(300)).nullable().optional(),
  metiersVises: z.array(z.string().max(300)).nullable().optional(),
  debouches: z.string().max(12000).nullable().optional(),
  tauxInsertion: z.number().min(0).max(100).nullable().optional(),
  conditionsAcces: z.string().max(12000).nullable().optional(),
  seriesAdmises: z.array(z.string().max(100)).nullable().optional(),
  ouSeFormer: z.string().max(4000).nullable().optional(),
  bourses: z.boolean().nullable().optional(),
  sources: z.array(z.object({
    libelle: z.string().max(300),
    url: z.string().url().max(2000),
    consulteLe: z.string().max(40),
    officielle: z.boolean(),
  })).nullable().optional(),
  domaines: z.array(domaineSchema).max(20).default([]),
  quotaBourses: z.number().int().min(0).nullable().optional(),
  quotaAides: z.number().int().min(0).nullable().optional(),
  modeEntree: z.string().max(3000).nullable().optional(),
  seriesRecommandees: z.string().max(1000).nullable().optional(),
  matieresClassement: z.string().max(3000).nullable().optional(),
  matieresCles: z.unknown().nullable().optional(),
  contenuMetier: z.unknown().nullable().optional(),
  etablissementId: z.string().nullable().optional(),
  imageUrl: z.string().max(2000).nullable().optional(),
  videoUrl: z.string().max(2000).nullable().optional(),
  masquee: z.boolean().optional(),
  offres: z.array(offreFiliereSchema).optional(),
});
const etablissementSchema = z.object({
  code: z.string().max(100).nullable().optional(),
  educmasterId: z.string().max(150).nullable().optional(),
  nom: z.string().trim().min(2).max(240),
  sigle: z.string().max(80).nullable().optional(),
  universite: z.string().max(240).nullable().optional(),
  type: z.nativeEnum(TypeEtablissement),
  departement: z.string().max(100).nullable().optional(),
  commune: z.string().max(100).nullable().optional(),
  quartier: z.string().max(240).nullable().optional(),
  internat: z.boolean().nullable().optional(),
  externat: z.boolean().nullable().optional(),
  capacite: z.number().int().min(0).nullable().optional(),
  actif: z.boolean().default(true),
  offres: z.array(offreEtablissementSchema).optional(),
});
const pageSchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  titre: z.string().trim().min(2).max(240),
  intro: z.string().max(4000).nullable().optional(),
  sections: z.array(z.object({
    titre: z.string().trim().min(1).max(240),
    paragraphes: z.array(z.string().max(5000)).max(20),
    lienLabel: z.string().max(120).nullable().optional(),
    lienUrl: z.string().max(2000).nullable().optional().refine(
      (value) => value == null || value.startsWith('/') && !value.startsWith('//') || /^https:\/\//i.test(value),
      'Le lien doit être interne ou commencer par https://',
    ),
  })).max(40),
  statut: z.enum(['PUBLIE', 'ARCHIVE']).optional(),
});

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async resume() {
    const [filieres, etablissements, pages, brouillons] = await Promise.all([
      this.prisma.filiere.count({ where: { masquee: false } }),
      this.prisma.etablissement.count({ where: { actif: true } }),
      this.prisma.pageSite.count({ where: { statut: StatutPageSite.PUBLIE } }),
      this.prisma.brouillonAdmin.count({ where: { etat: EtatBrouillonAdmin.BROUILLON } }),
    ]);
    return { filieres, etablissements, pagesPubliees: pages, brouillons };
  }

  async catalogue() {
    return this.prisma.filiere.findMany({
      orderBy: [{ masquee: 'asc' }, { nom: 'asc' }],
      include: { etablissement: true, offres: { select: { etablissementId: true, duree: true, source: true } } },
    });
  }

  async etablissements() {
    return this.prisma.etablissement.findMany({
      orderBy: [{ actif: 'desc' }, { departement: 'asc' }, { nom: 'asc' }],
      include: { offres: { select: { filiereId: true, duree: true, source: true } } },
    });
  }

  async pages() {
    return this.prisma.pageSite.findMany({ orderBy: [{ slug: 'asc' }] });
  }

  async brouillons() {
    return this.prisma.brouillonAdmin.findMany({
      orderBy: [{ etat: 'asc' }, { updatedAt: 'desc' }],
      take: 200,
      include: { auteur: { select: { nom: true, prenom: true } } },
    });
  }

  async historique(type?: TypeRessourceAdmin, cibleId?: string) {
    return this.prisma.historiqueAdmin.findMany({
      where: { ...(type ? { type } : {}), ...(cibleId ? { cibleId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { auteur: { select: { nom: true, prenom: true } } },
    });
  }

  async creerBrouillon(type: TypeRessourceAdmin, cibleId: string | undefined, payloadBrut: unknown, auteurId: string) {
    const payload = this.valider(type, payloadBrut);
    if (cibleId) await this.snapshot(this.prisma, type, cibleId);
    if (type === TypeRessourceAdmin.PAGE_SITE && !cibleId) {
      const page = payload as z.infer<typeof pageSchema>;
      if (await this.prisma.pageSite.findUnique({ where: { slug: page.slug } })) {
        throw new ConflictException('Cette page existe déjà : ouvrez sa fiche pour préparer une modification.');
      }
    }
    const titre = this.titrePayload(type, payload);
    const brouillon = await this.prisma.brouillonAdmin.create({
      data: { type, cibleId: cibleId ?? null, titre, payload: payload as Prisma.InputJsonValue, auteurId },
    });
    await this.journal(auteurId, type, cibleId ?? brouillon.id, 'BROUILLON_CREE', null, payload);
    return brouillon;
  }

  async modifierBrouillon(id: string, payloadBrut: unknown, auteurId: string) {
    const brouillon = await this.prisma.brouillonAdmin.findUnique({ where: { id } });
    if (!brouillon) throw new NotFoundException('Brouillon introuvable.');
    if (brouillon.etat !== EtatBrouillonAdmin.BROUILLON) throw new ConflictException('Un brouillon publié n’est plus modifiable. Créez une nouvelle version depuis la fiche publiée.');
    const payload = this.valider(brouillon.type, payloadBrut);
    const updated = await this.prisma.brouillonAdmin.update({ where: { id }, data: { titre: this.titrePayload(brouillon.type, payload), payload: payload as Prisma.InputJsonValue } });
    await this.journal(auteurId, brouillon.type, brouillon.cibleId ?? id, 'BROUILLON_MODIFIE', brouillon.payload, payload);
    return updated;
  }

  async supprimerBrouillon(id: string, auteurId: string) {
    const brouillon = await this.prisma.brouillonAdmin.findUnique({ where: { id } });
    if (!brouillon) throw new NotFoundException('Brouillon introuvable.');
    if (brouillon.etat !== EtatBrouillonAdmin.BROUILLON) throw new ConflictException('Un brouillon publié fait partie de l’historique et ne peut pas être supprimé.');
    await this.prisma.$transaction([
      this.prisma.historiqueAdmin.create({ data: { auteurId, type: brouillon.type, cibleId: brouillon.cibleId ?? id, action: 'BROUILLON_SUPPRIME', avant: brouillon.payload as Prisma.InputJsonValue } }),
      this.prisma.brouillonAdmin.delete({ where: { id } }),
    ]);
    return { message: 'Brouillon supprimé.' };
  }

  async publierBrouillon(id: string, auteurId: string) {
    const brouillon = await this.prisma.brouillonAdmin.findUnique({ where: { id } });
    if (!brouillon) throw new NotFoundException('Brouillon introuvable.');
    if (brouillon.etat !== EtatBrouillonAdmin.BROUILLON) throw new ConflictException('Ce brouillon a déjà été publié.');
    const payload = this.valider(brouillon.type, brouillon.payload);

    return this.prisma.$transaction(async (tx) => {
      const avant = brouillon.cibleId ? await this.snapshot(tx, brouillon.type, brouillon.cibleId) : null;
      let cibleId = brouillon.cibleId;
      if (brouillon.type === TypeRessourceAdmin.FILIERE) {
        cibleId = await this.publierFiliere(tx, cibleId, payload as z.infer<typeof filiereSchema>);
      } else if (brouillon.type === TypeRessourceAdmin.ETABLISSEMENT) {
        cibleId = await this.publierEtablissement(tx, cibleId, payload as z.infer<typeof etablissementSchema>);
      } else {
        cibleId = await this.publierPage(tx, cibleId, payload as z.infer<typeof pageSchema>);
      }
      const apres = await this.snapshot(tx, brouillon.type, cibleId);
      await tx.historiqueAdmin.create({
        data: { auteurId, type: brouillon.type, cibleId, action: 'PUBLIE', avant: this.jsonOptionnel(avant), apres: this.jsonOptionnel(apres) },
      });
      return tx.brouillonAdmin.update({
        where: { id },
        data: { cibleId, etat: EtatBrouillonAdmin.PUBLIE, publieLe: new Date() },
      });
    });
  }

  async restaurer(id: string, auteurId: string) {
    const entree = await this.prisma.historiqueAdmin.findUnique({ where: { id } });
    if (!entree) throw new NotFoundException('Entrée d’historique introuvable.');
    if (!entree.avant) throw new ConflictException('Aucune version antérieure à restaurer pour cette entrée.');
    return this.creerBrouillon(entree.type, entree.cibleId, entree.avant, auteurId);
  }

  private valider(type: TypeRessourceAdmin, payload: unknown): object {
    const schema = type === TypeRessourceAdmin.FILIERE ? filiereSchema : type === TypeRessourceAdmin.ETABLISSEMENT ? etablissementSchema : pageSchema;
    const resultat = schema.safeParse(payload);
    if (!resultat.success) {
      throw new BadRequestException({ message: 'Le contenu ne respecte pas les champs attendus.', erreurs: resultat.error.issues.map((issue) => ({ champ: issue.path.join('.'), message: issue.message })) });
    }
    return resultat.data;
  }

  private titrePayload(type: TypeRessourceAdmin, payload: object) {
    const donnees = payload as Record<string, unknown>;
    return type === TypeRessourceAdmin.PAGE_SITE ? String(donnees.titre ?? donnees.slug) : String(donnees.nom ?? 'Sans titre');
  }

  private jsonOptionnel(value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull {
    return value == null ? Prisma.DbNull : value as Prisma.InputJsonValue;
  }

  private async journal(auteurId: string, type: TypeRessourceAdmin, cibleId: string, action: string, avant: unknown, apres: unknown) {
    await this.prisma.historiqueAdmin.create({
      data: { auteurId, type, cibleId, action, avant: this.jsonOptionnel(avant), apres: this.jsonOptionnel(apres) },
    });
  }

  private async snapshot(db: PrismaService | Prisma.TransactionClient, type: TypeRessourceAdmin, id: string): Promise<unknown> {
    if (type === TypeRessourceAdmin.FILIERE) {
      const row = await db.filiere.findUnique({ where: { id }, include: { offres: { select: { etablissementId: true, duree: true, source: true } } } });
      if (!row) throw new NotFoundException('Filière introuvable.');
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = row;
      return { ...payload, offres: row.offres.map(({ etablissementId, duree, source }) => ({ filiereId: id, etablissementId, duree, source })) };
    }
    if (type === TypeRessourceAdmin.ETABLISSEMENT) {
      const row = await db.etablissement.findUnique({ where: { id }, include: { offres: { select: { filiereId: true, duree: true, source: true } } } });
      if (!row) throw new NotFoundException('Établissement introuvable.');
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = row;
      return { ...payload, offres: row.offres };
    }
    const row = await db.pageSite.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Page éditoriale introuvable.');
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, publieLe: _publieLe, ...payload } = row;
    return payload;
  }

  private async publierFiliere(tx: Prisma.TransactionClient, id: string | null, payload: z.infer<typeof filiereSchema>): Promise<string> {
    const { offres, contenuMetier, matieresCles, ...champs } = payload;
    const jsonFields = {
      diplomesDelivres: this.jsonOptionnel(champs.diplomesDelivres),
      metiersVises: this.jsonOptionnel(champs.metiersVises),
      seriesAdmises: this.jsonOptionnel(champs.seriesAdmises),
      sources: this.jsonOptionnel(champs.sources),
      contenuMetier: this.jsonOptionnel(contenuMetier),
      matieresCles: this.jsonOptionnel(matieresCles),
    };
    const data = { ...champs, ...jsonFields, domaines: champs.domaines ?? [], masquee: champs.masquee ?? false };
    const filiere = id
      ? await tx.filiere.update({ where: { id }, data: data as Prisma.FiliereUncheckedUpdateInput })
      : await tx.filiere.create({ data: data as Prisma.FiliereUncheckedCreateInput });
    if (offres) {
      await tx.offreFormation.deleteMany({ where: { filiereId: filiere.id } });
      if (offres.length) await tx.offreFormation.createMany({ data: offres.map((offre) => ({ filiereId: filiere.id, etablissementId: offre.etablissementId, duree: offre.duree ?? null, source: offre.source })) });
    }
    return filiere.id;
  }

  private async publierEtablissement(tx: Prisma.TransactionClient, id: string | null, payload: z.infer<typeof etablissementSchema>): Promise<string> {
    const { offres, ...champs } = payload;
    const data = { ...champs, actif: champs.actif ?? true };
    const etablissement = id
      ? await tx.etablissement.update({ where: { id }, data })
      : await tx.etablissement.create({ data });
    if (offres) {
      await tx.offreFormation.deleteMany({ where: { etablissementId: etablissement.id } });
      if (offres.length) await tx.offreFormation.createMany({ data: offres.map((offre) => ({ filiereId: offre.filiereId, etablissementId: etablissement.id, duree: offre.duree ?? null, source: offre.source })) });
    }
    return etablissement.id;
  }

  private async publierPage(tx: Prisma.TransactionClient, id: string | null, payload: z.infer<typeof pageSchema>): Promise<string> {
    const statut = payload.statut === 'ARCHIVE' ? StatutPageSite.ARCHIVE : StatutPageSite.PUBLIE;
    const data = { slug: payload.slug, titre: payload.titre, intro: payload.intro ?? null, sections: payload.sections as Prisma.InputJsonValue, statut, publieLe: statut === StatutPageSite.PUBLIE ? new Date() : null };
    const page = id
      ? await tx.pageSite.update({ where: { id }, data })
      : await tx.pageSite.create({ data });
    return page.id;
  }
}
