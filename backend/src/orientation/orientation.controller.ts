import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccesApprenantGuard } from '../auth/acces-apprenant.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrientationService } from './orientation.service';

/** Les recommandations restent consultables même si l’onboarding n’est pas encore rempli. */
@ApiTags('Orientation')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), AccesApprenantGuard)
@Controller('orientation')
export class OrientationController {
  constructor(private orientationService: OrientationService) {}

  @Get(':nip/recommandations')
  @ApiOperation({ summary: 'Recommandations d\'orientation' })
  async getRecommandations(@Param('nip') nip: string) {
    return this.orientationService.getRecommandations(nip);
  }

  @Post(':nip/calcul')
  @ApiOperation({ summary: "Calculer les recommandations pour la classe actuelle de l'élève" })
  async calculer(@Param('nip') nip: string) {
    return this.orientationService.calculerRecommandations(nip);
  }

  @Get(':nip/explain/:recommandationId')
  @ApiOperation({ summary: 'Explication d\'une recommandation' })
  async explain(
    @Param('nip') nip: string,
    @Param('recommandationId') recommandationId: string,
  ) {
    return this.orientationService.explain(nip, recommandationId);
  }

  @Get(':nip/evaluer/:code')
  @ApiOperation({
    summary: "Évaluer une formation précise pour l'élève, même hors de ses pistes déjà calculées (ex. un vœu envisagé qui ne remplit pas encore les conditions)",
  })
  async evaluer(@Param('nip') nip: string, @Param('code') code: string) {
    return this.orientationService.evaluerFiliere(nip, code);
  }
}
