import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrientationService } from './orientation.service';

@ApiTags('Orientation')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('orientation')
export class OrientationController {
  constructor(private orientationService: OrientationService) {}

  @Get(':nip/recommandations')
  @ApiOperation({ summary: 'Recommandations d\'orientation' })
  async getRecommandations(@Param('nip') nip: string) {
    return this.orientationService.getRecommandations(nip);
  }

  @Post(':nip/calcul')
  @ApiOperation({ summary: 'Déclencher le calcul des recommandations' })
  async calculer(@Param('nip') nip: string) {
    return this.orientationService.calculerRecommandations(nip, 'TROISIEME');
  }

  @Get(':nip/explain/:recommandationId')
  @ApiOperation({ summary: 'Explication d\'une recommandation' })
  async explain(
    @Param('nip') nip: string,
    @Param('recommandationId') recommandationId: string,
  ) {
    return this.orientationService.explain(recommandationId);
  }
}
