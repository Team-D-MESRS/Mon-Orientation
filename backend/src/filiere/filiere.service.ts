import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NiveauAcces, Prisma, TypeFiliere } from '@prisma/client';
import { compatibiliteSerie } from '../orientation/profils-filieres';
import { DOMAINES, Domaine } from './domaines';

/** Accès d'une filière du supérieur pour la série de bac demandée. */
export type AccesSerie = 'ADMISE' | 'SOUS_CONDITIONS';

export interface FiltresCatalogue {
  type?: TypeFiliere;
  niveau?: NiveauAcces;
  departement?: string;
  search?: string;
  /** Série de bac (ex. « D ») : filières du supérieur qui l'admettent, éventuellement sous conditions */
  serie?: string;
  domaine?: Domaine;
  bourses?: boolean;
  /** true : au moins une source officielle ; false : fiches à confirmer */
  officielle?: boolean;
  page?: number;
  limit?: number;
}

const PREFIXE_BAC = 'BAC-';
const ORDRE: Prisma.FiliereOrderByWithRelationInput[] = [{ type: 'asc' }, { nom: 'asc' }];
/** Lieux de formation d'une fiche, par département puis par nom ; les écoles des métiers, sans adresse connue, en dernier. */
const LIEUX_DE_FORMATION = {
  select: {
    duree: true,
    etablissement: {
      select: { code: true, nom: true, type: true, departement: true, commune: true, quartier: true, internat: true, externat: true },
    },
  },
  orderBy: [{ etablissement: { departement: { sort: 'asc', nulls: 'last' } } }, { etablissement: { nom: 'asc' } }],
} satisfies Prisma.Filiere$offresArgs;
const AVEC_SOURCE_OFFICIELLE: Prisma.FiliereWhereInput = { sources: { array_contains: [{ officielle: true }] } };

/** Apostrophes typographiques ramenées à l'apostrophe droite, espaces superflus retirés. */
const normaliserRecherche = (texte?: string) =>
  (texte ?? '').replace(/[’‘`]/g, "'").replace(/\s+/g, ' ').trim().slice(0, 100);

/** « Baccalauréat série D — Biologie – Géologie » → « Biologie – Géologie » */
const intituleSerie = (nom: string) => (nom.split(' — ').slice(1).join(' — ') || nom).replace(/^filière /, '');

@Injectable()
export class FiliereService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: FiltresCatalogue) {
    const { type, niveau, departement, search, serie, domaine, bourses, officielle, page = 1, limit = 20 } = filters || {};

    // Les fiches masquées (séries générales du bac) sortent du catalogue et des comptages ; elles
    // restent consultables par leur lien et alimentent le filtre « Et après ce bac ? » (series()).
    const where: Prisma.FiliereWhereInput = { masquee: false };
    const restrictions: Prisma.FiliereWhereInput[] = [];

    if (type) {
      where.type = type;
    }

    if (niveau) {
      where.niveauAcces = niveau;
    }

    if (departement) {
      // Supérieur : son établissement ; secondaire technique : l'un de ses lieux de formation
      restrictions.push({
        OR: [{ etablissement: { departement } }, { offres: { some: { etablissement: { departement } } } }],
      });
    }

    if (domaine) {
      where.domaines = { has: domaine };
    }

    if (bourses !== undefined) {
      where.bourses = bourses;
    }

    if (officielle !== undefined) {
      restrictions.push(
        officielle ? AVEC_SOURCE_OFFICIELLE : { OR: [{ sources: { equals: Prisma.DbNull } }, { NOT: AVEC_SOURCE_OFFICIELLE }] },
      );
    }

    const acces = serie ? await this.accesParSerie(serie) : undefined;
    if (acces) {
      restrictions.push({ id: { in: [...acces.keys()] } });
    }

    const pertinence = await this.pertinence(normaliserRecherche(search));
    if (pertinence) {
      restrictions.push({ id: { in: [...pertinence.keys()] } });
    }

    if (restrictions.length > 0) {
      where.AND = restrictions;
    }

    let items: Prisma.FiliereGetPayload<{ include: { etablissement: true } }>[];
    let total: number;
    if (pertinence) {
      // Recherche : les filières dont le nom contient le texte d'abord (tri stable : l'ordre habituel est conservé ensuite)
      const toutes = await this.prisma.filiere.findMany({ where, include: { etablissement: true }, orderBy: ORDRE });
      toutes.sort((a, b) => (pertinence.get(a.id) ?? 1) - (pertinence.get(b.id) ?? 1));
      total = toutes.length;
      items = toutes.slice((page - 1) * limit, page * limit);
    } else {
      [items, total] = await Promise.all([
        this.prisma.filiere.findMany({
          where,
          include: { etablissement: true },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: ORDRE,
        }),
        this.prisma.filiere.count({ where }),
      ]);
    }

    return {
      items: acces ? items.map((f) => ({ ...f, accesSerie: acces.get(f.id) })) : items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Recherche insensible à la casse et aux accents (extension unaccent) sur le nom, le code, la description,
   * les débouchés, les métiers, les diplômes, le lieu de formation, les domaines, et le nom, la commune ou
   * le département des établissements où la formation est ouverte.
   * Renvoie, pour chaque filière trouvée, 0 si le texte figure dans son nom, 1 sinon.
   */
  private async pertinence(motif: string): Promise<Map<string, number> | undefined> {
    if (!motif) return undefined;
    const lignes = await this.prisma.$queryRaw<{ id: string; dans_nom: boolean }[]>`
      SELECT id, strpos(lower(unaccent(nom)), lower(unaccent(${motif}::text))) > 0 AS dans_nom
      FROM filieres
      WHERE strpos(
        lower(unaccent(concat_ws(' ', nom, code, description, debouches, ou_se_former,
          metiers_vises::text, diplomes_delivres::text, array_to_string(domaines, ' ')))),
        lower(unaccent(${motif}::text))
      ) > 0
      OR EXISTS (
        SELECT 1 FROM offres_formation o JOIN etablissements e ON e.id = o.etablissement_id
        WHERE o.filiere_id = filieres.id
          AND strpos(lower(unaccent(concat_ws(' ', e.nom, e.commune, e.departement))), lower(unaccent(${motif}::text))) > 0
      )`;
    return new Map(lignes.map((l) => [l.id, l.dans_nom ? 0 : 1]));
  }

  /** Filières du supérieur accessibles avec la série de bac demandée. Les filières sans séries renseignées sont écartées. */
  private async accesParSerie(serie: string): Promise<Map<string, AccesSerie>> {
    const series = await this.series();
    if (!series.some((s) => s.serie === serie)) {
      throw new BadRequestException(`Série inconnue. Valeurs possibles : ${series.map((s) => s.serie).join(', ')}`);
    }
    const filieres = await this.prisma.filiere.findMany({
      where: { niveauAcces: 'APRES_BAC' },
      select: { id: true, seriesAdmises: true },
    });
    const acces = new Map<string, AccesSerie>();
    for (const f of filieres) {
      const compatibilite = compatibiliteSerie(f.seriesAdmises as string[] | null, serie);
      if (compatibilite === 'admise') acces.set(f.id, 'ADMISE');
      else if (compatibilite === 'sous_conditions') acces.set(f.id, 'SOUS_CONDITIONS');
    }
    return acces;
  }

  /** Séries du baccalauréat présentes dans le catalogue (fiches BAC-*). */
  async series() {
    const bacs = await this.prisma.filiere.findMany({
      where: { code: { startsWith: PREFIXE_BAC } },
      select: { id: true, code: true, nom: true, type: true },
      orderBy: { code: 'asc' },
    });
    return bacs.map((b) => ({
      serie: (b.code as string).slice(PREFIXE_BAC.length),
      libelle: intituleSerie(b.nom),
      type: b.type,
      filiereId: b.id,
    }));
  }

  /** Valeurs proposées par les filtres du catalogue, avec le nombre de filières par domaine. */
  async filtres() {
    const [series, parDomaine, departements] = await Promise.all([
      this.series(),
      this.prisma.$queryRaw<{ domaine: string; total: number }[]>`
        SELECT d AS domaine, count(*)::int AS total FROM filieres, unnest(domaines) AS d
        WHERE NOT masquee GROUP BY d`,
      // Formations ouvertes dans chaque département : lieux du secondaire technique, établissement du supérieur
      this.prisma.$queryRaw<{ nom: string; total: number }[]>`
        SELECT e.departement AS nom, count(DISTINCT f.id)::int AS total
        FROM filieres f
        LEFT JOIN offres_formation o ON o.filiere_id = f.id
        JOIN etablissements e ON e.id = COALESCE(o.etablissement_id, f.etablissement_id)
        WHERE NOT f.masquee AND e.departement IS NOT NULL
        GROUP BY e.departement
        ORDER BY e.departement`,
    ]);
    const totaux = new Map(parDomaine.map((d) => [d.domaine, d.total]));
    const domaines = (Object.keys(DOMAINES) as Domaine[])
      .map((code) => ({ code, libelle: DOMAINES[code], total: totaux.get(code) ?? 0 }))
      .sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));
    return { domaines, series, departements };
  }

  async findOne(id: string) {
    const filiere = await this.prisma.filiere.findUnique({
      where: { id },
      include: { etablissement: true, offres: LIEUX_DE_FORMATION },
    });
    if (!filiere) throw new NotFoundException('Filière non trouvée');
    return filiere;
  }

  async findByCode(code: string) {
    return this.prisma.filiere.findUnique({ where: { code }, include: { offres: LIEUX_DE_FORMATION } });
  }

  async getDebouches(id: string) {
    const filiere = await this.prisma.filiere.findUnique({
      where: { id },
      select: { debouches: true, tauxInsertion: true, metiersVises: true },
    });
    if (!filiere) throw new NotFoundException('Filière non trouvée');
    return filiere;
  }
}
