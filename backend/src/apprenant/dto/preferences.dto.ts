import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PreferencesDto {
  @ApiProperty({ description: 'Filière du 1er vœu' })
  @IsUUID('4', { message: 'Le 1er choix est invalide' })
  filiereId1: string;

  @ApiPropertyOptional({ description: 'Filière du 2e vœu' })
  @IsOptional()
  @IsUUID('4', { message: 'Le 2e choix est invalide' })
  filiereId2?: string;

  @ApiPropertyOptional({ description: 'Filière du 3e vœu (Terminale seulement, nécessite un 2e vœu)' })
  @IsOptional()
  @IsUUID('4', { message: 'Le 3e choix est invalide' })
  filiereId3?: string;

  @ApiPropertyOptional({ description: "Établissement demandé (3e seulement, fiche unique d'inscription)" })
  @IsOptional()
  @IsUUID('4', { message: "L'établissement choisi est invalide" })
  etablissementId?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'La motivation ne doit pas dépasser 1000 caractères' })
  motivation?: string;
}
