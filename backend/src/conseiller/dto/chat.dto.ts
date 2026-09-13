import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty({ example: 'Quelles filières après la 3e ?' })
  @IsString()
  @IsNotEmpty({ message: 'Le message est vide' })
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({ example: 'fr' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  langue?: string;
}
