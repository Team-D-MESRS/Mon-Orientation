import { TypeRessourceAdmin } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreerBrouillonDto {
  @IsEnum(TypeRessourceAdmin)
  type!: TypeRessourceAdmin;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  cibleId?: string;

  @IsObject()
  payload!: Record<string, unknown>;
}

export class ModifierBrouillonDto {
  @IsObject()
  payload!: Record<string, unknown>;
}
