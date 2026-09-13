import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { NiveauAcces, TypeFiliere } from '@prisma/client';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FiliereService } from './filiere.service';

@ApiTags('Catalogue')
@Controller('filiere')
export class FiliereController {
  constructor(private filiereService: FiliereService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des filières (catalogue)' })
  @ApiQuery({ name: 'type', required: false, enum: TypeFiliere })
  @ApiQuery({ name: 'niveau', required: false, enum: NiveauAcces })
  @ApiQuery({ name: 'departement', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('type') type?: string,
    @Query('niveau') niveau?: string,
    @Query('departement') departement?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (type && !(type in TypeFiliere)) {
      throw new BadRequestException(`type doit valoir ${Object.keys(TypeFiliere).join(', ')}`);
    }
    if (niveau && !(niveau in NiveauAcces)) {
      throw new BadRequestException(`niveau doit valoir ${Object.keys(NiveauAcces).join(', ')}`);
    }

    return this.filiereService.findAll({
      type: type as TypeFiliere | undefined,
      niveau: niveau as NiveauAcces | undefined,
      departement,
      search,
      page: page ? Math.max(parseInt(page) || 1, 1) : 1,
      limit: limit ? Math.min(Math.max(parseInt(limit) || 20, 1), 100) : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une filière' })
  async findOne(@Param('id') id: string) {
    return this.filiereService.findOne(id);
  }

  @Get(':id/debouches')
  @ApiOperation({ summary: 'Débouchés et taux d\'insertion' })
  async getDebouches(@Param('id') id: string) {
    return this.filiereService.getDebouches(id);
  }
}
