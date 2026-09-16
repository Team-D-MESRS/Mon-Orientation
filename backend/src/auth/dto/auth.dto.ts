import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Il n'y a pas d'inscription sur la plateforme : l'élève et son parent s'identifient avec les
 * identifiants qu'ils utilisent déjà sur EducMaster (SPEC §5.6). Les personnels du ministère
 * passent par une route distincte, avec un compte interne.
 */
export class IdentificationDto {
  @ApiProperty({ example: 'DEMO-3E-0001', description: 'NIP ou numéro EducMaster de l’élève' })
  @IsString()
  @IsNotEmpty({ message: "L'identifiant est obligatoire" })
  @MaxLength(254)
  identifiant: string;

  @ApiProperty({ example: 'motdepasse123', description: 'Mot de passe EducMaster' })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  @MaxLength(128)
  motDePasse: string;
}

export class PersonnelDto {
  @ApiProperty({ example: 'agent@monorientation.bj', description: 'Adresse professionnelle' })
  @IsString()
  @IsNotEmpty({ message: "L'identifiant est obligatoire" })
  @MaxLength(254)
  identifiant: string;

  @ApiProperty({ example: 'motdepasse123' })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  @MaxLength(128)
  motDePasse: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
