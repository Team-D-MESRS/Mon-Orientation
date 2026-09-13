import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NiveauAcces, Prisma, TypeFiliere } from '@prisma/client';

@Injectable()
export class FiliereService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: {
    type?: TypeFiliere;
    niveau?: NiveauAcces;
    departement?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, niveau, departement, search, page = 1, limit = 20 } = filters || {};

    const where: Prisma.FiliereWhereInput = {};

    if (type) {
      where.type = type;
    }

    if (niveau) {
      where.niveauAcces = niveau;
    }

    if (departement) {
      where.etablissement = { departement };
    }

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { debouches: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.filiere.findMany({
        where,
        include: { etablissement: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ type: 'asc' }, { nom: 'asc' }],
      }),
      this.prisma.filiere.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const filiere = await this.prisma.filiere.findUnique({
      where: { id },
      include: { etablissement: true },
    });
    if (!filiere) throw new NotFoundException('Filière non trouvée');
    return filiere;
  }

  async findByCode(code: string) {
    return this.prisma.filiere.findUnique({ where: { code } });
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
