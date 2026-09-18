import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LANGUES, Langue } from '../prompt-conseiller';

/** Formats produits par l'enregistreur audio des navigateurs, acceptés en entrée par Gemini. */
export const MIMES_AUDIO_ACCEPTES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/aac'];
/** Environ 4 Mo en binaire (marge sous la limite de 6 Mo posée sur le corps de la requête, JSON alentour compris). */
const TAILLE_AUDIO_MAX = 5_500_000;

export class AudioDto {
  @ApiProperty({ description: 'Données audio encodées en base64 (sans le préfixe data:...;base64,)' })
  @IsString()
  @IsNotEmpty({ message: 'La note vocale est vide' })
  @MaxLength(TAILLE_AUDIO_MAX, { message: 'Note vocale trop longue' })
  data: string;

  @ApiProperty({ enum: MIMES_AUDIO_ACCEPTES, example: 'audio/webm' })
  @IsString()
  @IsIn(MIMES_AUDIO_ACCEPTES, { message: `Le type de la note vocale doit valoir ${MIMES_AUDIO_ACCEPTES.join(', ')}` })
  mimeType: string;
}

export class ChatDto {
  // Message écrit obligatoire seulement en l'absence de note vocale : l'un ou l'autre, pas ni l'un ni l'autre
  // (langues locales peu écrites — fon, yoruba, mina — d'où la voix comme second canal d'entrée).
  @ApiPropertyOptional({ example: 'Quelles filières après la 3e ?' })
  @ValidateIf((o: ChatDto) => !o.audio)
  @IsString()
  @IsNotEmpty({ message: 'Le message est vide' })
  @MaxLength(2000)
  message?: string;

  @ApiPropertyOptional({ type: AudioDto, description: "Note vocale, à la place du message écrit" })
  @IsOptional()
  @ValidateNested()
  @Type(() => AudioDto)
  audio?: AudioDto;

  @ApiPropertyOptional({ description: 'Conversation à poursuivre ; absent pour en commencer une nouvelle' })
  @IsOptional()
  @IsUUID('4', { message: 'conversationId invalide' })
  conversationId?: string;

  @ApiPropertyOptional({ enum: LANGUES, default: 'fr', description: 'Langue des réponses : français ou fongbé' })
  @IsOptional()
  @IsIn(LANGUES, { message: `langue doit valoir ${LANGUES.join(' ou ')}` })
  langue?: Langue;
}
