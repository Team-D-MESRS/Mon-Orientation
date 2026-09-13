import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AccesApprenantGuard } from '../auth/acces-apprenant.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ThrottlerUtilisateurGuard } from '../auth/throttler-utilisateur.guard';
import { UtilisateurConnecte, UtilisateurCourant } from '../auth/utilisateur-courant.decorator';
import { ConseillerService } from './conseiller.service';
import { ChatDto } from './dto/chat.dto';

@ApiTags('Conseiller IA')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), AccesApprenantGuard)
@Controller('conseiller')
export class ConseillerController {
  constructor(private conseillerService: ConseillerService) {}

  @Post(':nip/chat')
  @UseGuards(RolesGuard, ThrottlerUtilisateurGuard)
  @Roles('APPRENANT', 'PARENT')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: "Poser une question au conseiller (élève ou parent rattaché) ; réponse fondée sur le catalogue et le dossier de l'élève",
  })
  async chat(@Param('nip') nip: string, @Body() dto: ChatDto, @UtilisateurCourant() user: UtilisateurConnecte) {
    return this.conseillerService.chat(nip, dto.message, user, dto.conversationId, dto.langue);
  }

  @Get(':nip/historique')
  @ApiOperation({ summary: 'Dix dernières conversations (élève, parent rattaché, admin pour la supervision)' })
  async getHistorique(@Param('nip') nip: string) {
    return this.conseillerService.getHistorique(nip);
  }
}
