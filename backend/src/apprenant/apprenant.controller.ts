import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccesApprenantGuard } from '../auth/acces-apprenant.guard';
import { DecouverteCompleteeGuard } from '../auth/decouverte-completee.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApprenantService } from './apprenant.service';
import { PreferencesDto } from './dto/preferences.dto';
import { DecouverteDto } from './dto/decouverte.dto';

const ID_FILIERE = new ParseUUIDPipe({
  version: '4',
  exceptionFactory: () => new BadRequestException('Identifiant de filière invalide'),
});

@ApiTags('Apprenant')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), AccesApprenantGuard)
@Controller('apprenant')
export class ApprenantController {
  constructor(private apprenantService: ApprenantService) {}

  @Get(':nip')
  @ApiOperation({ summary: 'Profil apprenant et bilan des notes' })
  async getProfile(@Param('nip') nip: string) {
    return this.apprenantService.findByNip(nip);
  }

  @Get(':nip/notes')
  @ApiOperation({ summary: 'Notes de l\'apprenant' })
  async getNotes(@Param('nip') nip: string) {
    return this.apprenantService.getNotes(nip);
  }

  @Get(':nip/parcours')
  @ApiOperation({ summary: 'Parcours de l\'apprenant' })
  async getParcours(@Param('nip') nip: string) {
    return this.apprenantService.getParcours(nip);
  }

  @Get(':nip/decouverte')
  @ApiOperation({ summary: 'Questionnaire de découverte (goûts, ambitions, qualités…)' })
  async getDecouverte(@Param('nip') nip: string) {
    return this.apprenantService.getDecouverte(nip);
  }

  @Post(':nip/decouverte')
  @UseGuards(RolesGuard)
  @Roles('APPRENANT')
  @ApiOperation({ summary: 'Enregistrer le questionnaire de découverte ; recalcule les recommandations' })
  async enregistrerDecouverte(@Param('nip') nip: string, @Body() dto: DecouverteDto) {
    return this.apprenantService.enregistrerDecouverte(nip, dto);
  }

  @Get(':nip/preferences')
  @ApiOperation({ summary: 'Préférences d\'orientation' })
  async getPreferences(@Param('nip') nip: string) {
    return this.apprenantService.getPreferences(nip);
  }

  @Post(':nip/preferences')
  @UseGuards(RolesGuard, DecouverteCompleteeGuard)
  @Roles('APPRENANT')
  @ApiOperation({ summary: 'Enregistrer ses vœux (3e ou Terminale) ; recalcule les recommandations' })
  async enregistrerPreferences(@Param('nip') nip: string, @Body() dto: PreferencesDto) {
    return this.apprenantService.enregistrerPreferences(nip, dto);
  }

  @Post(':nip/preferences/validation')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('PARENT')
  @ApiOperation({ summary: 'Validation des vœux de l\'enfant par le parent' })
  async validerPreferences(@Param('nip') nip: string) {
    return this.apprenantService.validerPreferences(nip);
  }

  @Get(':nip/favoris')
  @ApiOperation({ summary: 'Formations mises de côté par l\'élève (visibles du parent)' })
  async getFavoris(@Param('nip') nip: string) {
    return this.apprenantService.getFavoris(nip);
  }

  @Put(':nip/favoris/:filiereId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('APPRENANT')
  @ApiOperation({ summary: 'Mettre une formation de côté (idempotent)' })
  async ajouterFavori(@Param('nip') nip: string, @Param('filiereId', ID_FILIERE) filiereId: string) {
    await this.apprenantService.ajouterFavori(nip, filiereId);
  }

  @Delete(':nip/favoris/:filiereId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('APPRENANT')
  @ApiOperation({ summary: 'Retirer une formation mise de côté (idempotent)' })
  async retirerFavori(@Param('nip') nip: string, @Param('filiereId', ID_FILIERE) filiereId: string) {
    await this.apprenantService.retirerFavori(nip, filiereId);
  }
}
