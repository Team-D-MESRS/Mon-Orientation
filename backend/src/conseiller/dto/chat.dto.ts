import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty({ example: 'Quelles filières après la 3e ?' })
  @IsString()
  @IsNotEmpty({ message: 'Le message est vide' })
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({ description: 'Conversation à poursuivre ; absent pour en commencer une nouvelle' })
  @IsOptional()
  @IsUUID('4', { message: 'conversationId invalide' })
  conversationId?: string;

  @ApiPropertyOptional({ example: 'fr' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  langue?: string;
}
