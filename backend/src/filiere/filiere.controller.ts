import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { NiveauAcces, TypeFiliere } from '@prisma/client';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FiliereService } from './filiere.service';
import { DOMAINES, estDomaine } from './domaines';

/** Un paramètre répété (?type=a&type=b) arrive sous forme de tableau : refusé plutôt que mal interprété. */
function unique(nom: string, valeur: unknown): string | undefined {
  if (Array.isArray(valeur)) throw new BadRequestException(`${nom} ne doit apparaître qu'une fois`);
  return (valeur as string | undefined) || undefined;
}

function booleen(nom: string, valeur: unknown): boolean | undefined {
  const texte = unique(nom, valeur);
  if (texte === undefined) return undefined;
  if (texte === 'true' || texte === 'false') return texte === 'true';
  throw new BadRequestException(`${nom} doit valoir true ou false`);
}

@ApiTags('Catalogue')
@Controller('filiere')
export class FiliereController {
  constructor(private filiereService: FiliereService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des filières (catalogue)' })
  @ApiQuery({ name: 'type', required: false, enum: TypeFiliere })
  @ApiQuery({ name: 'niveau', required: false, enum: NiveauAcces })
  @ApiQuery({ name: 'departement', required: false })
  @ApiQuery({ name: 'search', required: false, description: 'Insensible à la casse et aux accents ; porte aussi sur les métiers et le lieu de formation' })
  @ApiQuery({ name: 'serie', required: false, description: 'Série de bac : filières du supérieur qui l’admettent (champ accesSerie dans la réponse)' })
  @ApiQuery({ name: 'domaine', required: false, enum: Object.keys(DOMAINES) })
  @ApiQuery({ name: 'bourses', required: false, type: Boolean })
  @ApiQuery({ name: 'officielle', required: false, type: Boolean, description: 'true : au moins une source officielle ; false : fiches à confirmer' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('type') typeBrut?: unknown,
    @Query('niveau') niveauBrut?: unknown,
    @Query('departement') departement?: unknown,
    @Query('search') search?: unknown,
    @Query('serie') serieBrute?: unknown,
    @Query('domaine') domaineBrut?: unknown,
    @Query('bourses') bourses?: unknown,
    @Query('officielle') officielle?: unknown,
    @Query('page') page?: unknown,
    @Query('limit') limit?: unknown,
  ) {
    const type = unique('type', typeBrut);
    const niveau = unique('niveau', niveauBrut);
    const domaine = unique('domaine', domaineBrut);
    const serie = unique('serie', serieBrute)?.trim().toUpperCase();
    const numeroPage = unique('page', page);
    const taille = unique('limit', limit);

    if (type && !(type in TypeFiliere)) {
      throw new BadRequestException(`type doit valoir ${Object.keys(TypeFiliere).join(', ')}`);
    }
    if (niveau && !(niveau in NiveauAcces)) {
      throw new BadRequestException(`niveau doit valoir ${Object.keys(NiveauAcces).join(', ')}`);
    }
    if (domaine && !estDomaine(domaine)) {
      throw new BadRequestException(`domaine doit valoir ${Object.keys(DOMAINES).join(', ')}`);
    }

    return this.filiereService.findAll({
      type: type as TypeFiliere | undefined,
      niveau: niveau as NiveauAcces | undefined,
      departement: unique('departement', departement),
      search: unique('search', search),
      serie: serie || undefined,
      domaine: domaine as keyof typeof DOMAINES | undefined,
      bourses: booleen('bourses', bourses),
      officielle: booleen('officielle', officielle),
      page: numeroPage ? Math.max(parseInt(numeroPage) || 1, 1) : 1,
      // 500 : de quoi charger toutes les formations d'un niveau (saisie des vœux)
      limit: taille ? Math.min(Math.max(parseInt(taille) || 20, 1), 500) : 20,
    });
  }

  // Déclarée avant « :id », qui l'intercepterait sinon
  @Get('filtres')
  @ApiOperation({ summary: 'Valeurs des filtres du catalogue : domaines (avec leur nombre de filières) et séries du bac' })
  async filtres() {
    return this.filiereService.filtres();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une filière' })
  async findOne(@Param('id') id: string) {
    return this.filiereService.findOne(id);
  }

  @Get(':id/debouches')
  @ApiOperation({ summary: 'Débouchés et taux d\'insertion' })
  async getDebouches(@Param('id') id: string) {
    return this.filiereService.getDebouches(id);
  }
}
