import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccesApprenantGuard } from '../auth/acces-apprenant.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApprenantService } from './apprenant.service';
import { PreferencesDto } from './dto/preferences.dto';

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

  @Get(':nip/preferences')
  @ApiOperation({ summary: 'Préférences d\'orientation' })
  async getPreferences(@Param('nip') nip: string) {
    return this.apprenantService.getPreferences(nip);
  }

  @Post(':nip/preferences')
  @UseGuards(RolesGuard)
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
}
