import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@ApiTags('Statistiques')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('stats')
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('national')
  @ApiOperation({ summary: 'Statistiques nationales' })
  async getStatsNationales() {
    return this.statsService.getStatsNationales();
  }

  @Get('departement/:code')
  @ApiOperation({ summary: 'Statistiques par département' })
  async getStatsDepartement(@Param('code') code: string) {
    return this.statsService.getStatsDepartement(code);
  }

  @Get('filiere')
  @ApiOperation({ summary: 'Statistiques par filière' })
  async getStatsFiliere() {
    return this.statsService.getStatsFiliere();
  }
}
