import { BadRequestException, Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { StatsService } from './stats.service';

@ApiTags('Statistiques DGES')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('DGES')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('national')
  @ApiOperation({ summary: 'Statistiques nationales agrégées' })
  getStatsNationales() { return this.statsService.getStatsNationales(); }

  @Get('departements')
  @ApiOperation({ summary: 'Statistiques agrégées par département' })
  getStatsDepartements() { return this.statsService.getStatsDepartements(); }

  @Get('departement/:code')
  @ApiOperation({ summary: 'Statistiques agrégées d’un département' })
  getStatsDepartement(@Param('code') code: string) { return this.statsService.getStatsDepartement(code); }

  @Get('filiere')
  @ApiOperation({ summary: 'Répartition agrégée par type de formation' })
  getStatsFiliere() { return this.statsService.getStatsFiliere(); }

  @Get('observatoire')
  @ApiOperation({ summary: 'Tableau de bord approfondi, uniquement agrégé et sans données nominatives' })
  @ApiQuery({ name: 'debut', required: false, description: 'Date inclusive AAAA-MM-JJ' })
  @ApiQuery({ name: 'fin', required: false, description: 'Date inclusive AAAA-MM-JJ' })
  @ApiQuery({ name: 'departement', required: false })
  observatoire(@Query('debut') debut?: string, @Query('fin') fin?: string, @Query('departement') departement?: string) {
    return this.statsService.getObservatoire(debut, fin, departement);
  }

  @Get('export')
  @ApiOperation({ summary: 'Exporter les indicateurs agrégés en CSV ou XLSX' })
  @ApiQuery({ name: 'format', required: true, enum: ['csv', 'xlsx'] })
  async exporter(
    @Query('format') format: string,
    @Query('debut') debut: string | undefined,
    @Query('fin') fin: string | undefined,
    @Query('departement') departement: string | undefined,
    @Res() res: Response,
  ) {
    if (format !== 'csv' && format !== 'xlsx') throw new BadRequestException('format doit valoir csv ou xlsx.');
    const contenu = await this.statsService.exporter(format, debut, fin, departement);
    const nom = `observatoire-dges-${new Date().toISOString().slice(0, 10)}.${format}`;
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
    res.setHeader('Content-Disposition', `attachment; filename="${nom}"`);
    res.send(contenu);
  }
}
