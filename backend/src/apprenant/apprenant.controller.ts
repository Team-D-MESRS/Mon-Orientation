import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccesApprenantGuard } from '../auth/acces-apprenant.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApprenantService } from './apprenant.service';

@ApiTags('Apprenant')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), AccesApprenantGuard)
@Controller('apprenant')
export class ApprenantController {
  constructor(private apprenantService: ApprenantService) {}

  @Get(':nip')
  @ApiOperation({ summary: 'Profil apprenant' })
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
}
