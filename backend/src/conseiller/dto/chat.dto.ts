import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LANGUES, Langue } from '../prompt-conseiller';

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

  @ApiPropertyOptional({ enum: LANGUES, default: 'fr', description: 'Langue des réponses : français ou fongbé' })
  @IsOptional()
  @IsIn(LANGUES, { message: `langue doit valoir ${LANGUES.join(' ou ')}` })
  langue?: Langue;
}
