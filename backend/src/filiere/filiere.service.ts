import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FiliereService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: {
    type?: string;
    departement?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, departement, search, page = 1, limit = 20 } = filters || {};

    const where: Prisma.FiliereWhereInput = {};

    if (type) {
      where.type = type as any;
    }

    if (departement) {
      where.etablissement = { departement };
    }

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
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
        orderBy: { nom: 'asc' },
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

  async getDebouches(id: string) {
    const filiere = await this.prisma.filiere.findUnique({
      where: { id },
      select: { debouches: true, tauxInsertion: true, metiersVises: true },
    });
    if (!filiere) throw new NotFoundException('Filière non trouvée');
    return filiere;
  }
}
