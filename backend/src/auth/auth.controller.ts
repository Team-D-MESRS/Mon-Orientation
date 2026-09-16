import { Controller, Get, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { IdentificationDto, PersonnelDto, RefreshDto } from './dto/auth.dto';
import { ThrottlerIdentifiantGuard } from './throttler-identifiant.guard';
import { UtilisateurConnecte, UtilisateurCourant } from './utilisateur-courant.decorator';

const LIMITE_TENTATIVES = { default: { limit: 5, ttl: 60_000 } };

@ApiTags('Authentification')
@UseGuards(ThrottlerIdentifiantGuard)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('identification')
  @HttpCode(HttpStatus.OK)
  @Throttle(LIMITE_TENTATIVES)
  @ApiOperation({
    summary: "S'identifier avec ses identifiants EducMaster (élève : NIP ou numéro EducMaster ; parent : adresse)",
    description: "Il n'y a pas d'inscription : EducMaster fait foi, et le compte est créé à la première identification.",
  })
  async identification(@Body() dto: IdentificationDto) {
    return this.authService.identification(dto);
  }

  @Post('personnel')
  @HttpCode(HttpStatus.OK)
  @Throttle(LIMITE_TENTATIVES)
  @ApiOperation({ summary: 'Accès des personnels du ministère (compte interne : administration, DGES, établissement)' })
  async personnel(@Body() dto: PersonnelDto) {
    return this.authService.identificationPersonnel(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir le token (rotation du refresh token)' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('deconnexion')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Se déconnecter (révoque toutes les sessions de l\'utilisateur)' })
  async logout(@UtilisateurCourant() user: UtilisateurConnecte) {
    return this.authService.logout(user.id);
  }

  @Get('moi')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Profil de l\'utilisateur connecté et dossiers accessibles' })
  async moi(@UtilisateurCourant() user: UtilisateurConnecte) {
    return this.authService.moi(user.id);
  }
}
