import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FiliereService } from './filiere.service';

@ApiTags('Catalogue')
@Controller('filiere')
export class FiliereController {
  constructor(private filiereService: FiliereService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des filières (catalogue)' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'departement', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('type') type?: string,
    @Query('departement') departement?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.filiereService.findAll({
      type,
      departement,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
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
