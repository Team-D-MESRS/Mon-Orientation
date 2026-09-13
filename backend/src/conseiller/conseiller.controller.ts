import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccesApprenantGuard } from '../auth/acces-apprenant.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConseillerService } from './conseiller.service';
import { ChatDto } from './dto/chat.dto';

@ApiTags('Conseiller IA')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), AccesApprenantGuard)
@Controller('conseiller')
export class ConseillerController {
  constructor(private conseillerService: ConseillerService) {}

  @Post(':nip/chat')
  @ApiOperation({ summary: 'Envoyer un message au conseiller IA' })
  async chat(@Param('nip') nip: string, @Body() dto: ChatDto) {
    return this.conseillerService.chat(nip, dto.message, dto.langue);
  }

  @Get(':nip/historique')
  @ApiOperation({ summary: 'Historique des conversations' })
  async getHistorique(@Param('nip') nip: string) {
    return this.conseillerService.getHistorique(nip);
  }
}
