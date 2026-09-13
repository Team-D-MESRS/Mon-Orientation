import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConseillerService } from './conseiller.service';

@ApiTags('Conseiller IA')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('conseiller')
export class ConseillerController {
  constructor(private conseillerService: ConseillerService) {}

  @Post(':nip/chat')
  @ApiOperation({ summary: 'Envoyer un message au conseiller IA' })
  async chat(
    @Param('nip') nip: string,
    @Body('message') message: string,
    @Body('langue') langue?: string,
  ) {
    return this.conseillerService.chat(nip, message, langue);
  }

  @Get(':nip/historique')
  @ApiOperation({ summary: 'Historique des conversations' })
  async getHistorique(@Param('nip') nip: string) {
    return this.conseillerService.getHistorique(nip);
  }
}
