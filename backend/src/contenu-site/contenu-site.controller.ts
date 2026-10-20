import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatutPageSite } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Contenus du site')
@Controller('contenu-site')
export class ContenuSiteController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Lire une page éditoriale publiée, sans données de brouillon' })
  async lire(@Param('slug') slug: string) {
    const page = await this.prisma.pageSite.findFirst({ where: { slug, statut: StatutPageSite.PUBLIE } });
    if (!page) throw new NotFoundException('Cette page n’a pas de version éditoriale publiée.');
    return { slug: page.slug, titre: page.titre, intro: page.intro, sections: page.sections, updatedAt: page.updatedAt };
  }
}
