import { IsString, IsOptional, IsEmail, IsEnum, MinLength, MaxLength, IsDateString, IsNotEmpty, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const estApprenant = (dto: RegisterDto) => (dto.role ?? 'APPRENANT') === 'APPRENANT';

export class RegisterDto {
  @ApiPropertyOptional({ example: '1234567890', description: 'Obligatoire pour un apprenant : NIP attribué par EducMaster' })
  @ValidateIf(estApprenant)
  @IsString()
  @IsNotEmpty({ message: 'Le NIP est obligatoire pour un élève' })
  @MaxLength(50)
  nip?: string;

  @ApiPropertyOptional({ example: '2011-04-15', description: 'Obligatoire pour un apprenant : prouve que le NIP lui appartient' })
  @ValidateIf(estApprenant)
  @IsDateString({}, { message: 'La date de naissance doit être au format AAAA-MM-JJ' })
  dateNaissance?: string;

  @ApiPropertyOptional({ example: 'parent@email.com', description: 'Obligatoire pour un parent' })
  @ValidateIf((dto: RegisterDto) => dto.role === 'PARENT' || dto.email !== undefined)
  @IsEmail({}, { message: "L'adresse email est invalide" })
  email?: string;

  @ApiProperty({ example: 'Dupont' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MaxLength(100)
  nom: string;

  @ApiProperty({ example: 'Jean' })
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est obligatoire' })
  @MaxLength(100)
  prenom: string;

  @ApiProperty({ example: 'motdepasse123' })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(128)
  motDePasse: string;

  @ApiPropertyOptional({ enum: ['APPRENANT', 'PARENT'], description: 'Auto-inscription limitée aux apprenants et parents ; les autres rôles sont attribués par un administrateur' })
  @IsEnum(['APPRENANT', 'PARENT'], { message: 'role doit valoir APPRENANT ou PARENT' })
  @IsOptional()
  role?: string;
}

export class LoginDto {
  @ApiProperty({ example: '1234567890' })
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
