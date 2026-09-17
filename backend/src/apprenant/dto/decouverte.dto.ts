import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Le détail des champs (intérêts, qualités, ambitions…) est validé par `validerReponses`
 * (../decouverte.ts), pas par des décorateurs : la forme évolue avec le contenu du questionnaire,
 * qui n'est pas une donnée officielle à figer dans un DTO.
 */
export class DecouverteDto {
  @ApiProperty({ description: 'Réponses au questionnaire de découverte, voir ReponsesDecouverte' })
  @IsObject()
  reponses: Record<string, unknown>;
}
