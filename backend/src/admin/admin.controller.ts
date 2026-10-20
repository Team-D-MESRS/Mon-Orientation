import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TypeRessourceAdmin } from '@prisma/client';
import { UtilisateurConnecte, UtilisateurCourant } from '../auth/utilisateur-courant.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { MediaService } from '../media/media.service';
import { CreerBrouillonDto, ModifierBrouillonDto } from './dto/admin.dto';

@ApiTags('Administration éditoriale')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService, private readonly media: MediaService) {}

  @Get('resume')
  @ApiOperation({ summary: 'Compteurs de la console Admin, sans données personnelles' })
  resume() { return this.admin.resume(); }

  @Post('media')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024, files: 1 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } })
  @ApiOperation({ summary: 'Téléverser une image de filière en JPEG, PNG ou WebP (8 Mo maximum)' })
  televerserMedia(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Choisissez une image à téléverser.');
    return this.media.televerserImage(file);
  }

  @Get('catalogue')
  @ApiOperation({ summary: 'Toutes les filières, y compris les fiches archivées, pour édition' })
  catalogue() { return this.admin.catalogue(); }

  @Get('etablissements')
  @ApiOperation({ summary: 'Établissements et offres de formation, y compris les archives' })
  etablissements() { return this.admin.etablissements(); }

  @Get('pages')
  @ApiOperation({ summary: 'Pages éditoriales actuellement enregistrées' })
  pages() { return this.admin.pages(); }

  @Get('brouillons')
  @ApiOperation({ summary: 'Brouillons éditoriaux et de catalogue' })
  brouillons() { return this.admin.brouillons(); }

  @Get('historique')
  @ApiOperation({ summary: 'Historique des modifications, au plus 200 entrées' })
  historique(@Query('type') type?: TypeRessourceAdmin, @Query('cibleId') cibleId?: string) {
    if (type && !Object.values(TypeRessourceAdmin).includes(type)) throw new BadRequestException('Type de ressource invalide.');
    return this.admin.historique(type, cibleId);
  }

  @Post('brouillons')
  @ApiOperation({ summary: 'Créer un brouillon qui ne modifie pas encore le site public' })
  creer(@Body() dto: CreerBrouillonDto, @UtilisateurCourant() user: UtilisateurConnecte) {
    return this.admin.creerBrouillon(dto.type, dto.cibleId, dto.payload, user.id);
  }

  @Patch('brouillons/:id')
  @ApiOperation({ summary: 'Modifier un brouillon non publié' })
  modifier(@Param('id') id: string, @Body() dto: ModifierBrouillonDto, @UtilisateurCourant() user: UtilisateurConnecte) {
    return this.admin.modifierBrouillon(id, dto.payload, user.id);
  }

  @Delete('brouillons/:id')
  @ApiOperation({ summary: 'Supprimer un brouillon non publié, en journalisant l’opération' })
  supprimer(@Param('id') id: string, @UtilisateurCourant() user: UtilisateurConnecte) {
    return this.admin.supprimerBrouillon(id, user.id);
  }

  @Post('brouillons/:id/publier')
  @ApiOperation({ summary: 'Publier explicitement un brouillon dans le catalogue ou le CMS' })
  publier(@Param('id') id: string, @UtilisateurCourant() user: UtilisateurConnecte) {
    return this.admin.publierBrouillon(id, user.id);
  }

  @Post('historique/:id/restaurer')
  @ApiOperation({ summary: 'Préparer un brouillon de restauration à partir de la version précédente' })
  restaurer(@Param('id') id: string, @UtilisateurCourant() user: UtilisateurConnecte) {
    return this.admin.restaurer(id, user.id);
  }
}
