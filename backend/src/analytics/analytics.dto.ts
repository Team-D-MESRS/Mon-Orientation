import { TypeEvenementUsage } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class EvenementUsageDto {
  @IsEnum(TypeEvenementUsage)
  type!: TypeEvenementUsage;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  dimension?: string;
}
