import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApprenantService {
  constructor(private prisma: PrismaService) {}

  async findByNip(nip: string) {
    const apprenant = await this.prisma.apprenant.findUnique({
      where: { nip },
      include: { notes: true },
    });
    if (!apprenant) throw new NotFoundException('Apprenant non trouvé');
    return apprenant;
  }

  async getNotes(nip: string) {
    return this.prisma.note.findMany({
      where: { apprenantNip: nip },
      orderBy: [{ anneeScolaire: 'desc' }, { trimestre: 'desc' }],
    });
  }

  async getParcours(nip: string) {
    return this.prisma.note.findMany({
      where: { apprenantNip: nip },
      orderBy: [{ anneeScolaire: 'asc' }, { trimestre: 'asc' }],
      distinct: ['anneeScolaire'],
    });
  }

  async getPreferences(nip: string) {
    return this.prisma.preference.findMany({
      where: { apprenantNip: nip },
      include: {
        filiere1: true,
        filiere2: true,
        filiere3: true,
      },
    });
  }
}
