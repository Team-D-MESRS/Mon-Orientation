import { IsString, IsOptional, IsEmail, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiPropertyOptional({ example: '1234567890' })
  @IsString()
  @IsOptional()
  nip?: string;

  @ApiPropertyOptional({ example: 'jeune@email.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'Dupont' })
  @IsString()
  nom: string;

  @ApiProperty({ example: 'Jean' })
  @IsString()
  prenom: string;

  @ApiProperty({ example: 'motdepasse123' })
  @IsString()
  @MinLength(8)
  motDePasse: string;

  @ApiPropertyOptional({ enum: ['APPRENANT', 'PARENT'], description: 'Auto-inscription limitée aux apprenants et parents ; les autres rôles sont attribués par un administrateur' })
  @IsEnum(['APPRENANT', 'PARENT'], { message: 'role doit valoir APPRENANT ou PARENT' })
  @IsOptional()
  role?: string;
}

export class LoginDto {
  @ApiProperty({ example: '1234567890' })
  @IsString()
  identifiant: string;

  @ApiProperty({ example: 'motdepasse123' })
  @IsString()
  motDePasse: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
