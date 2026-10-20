import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { EvenementUsageDto } from './analytics.dto';

@ApiTags('Mesures d’audience anonymes')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('evenements')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Enregistrer une mesure agrégée après consentement, sans identité ou texte libre' })
  enregistrer(@Body() dto: EvenementUsageDto) {
    return this.analytics.enregistrer(dto.type, dto.dimension);
  }
}
