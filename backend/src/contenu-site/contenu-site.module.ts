import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ContenuSiteController } from './contenu-site.controller';

@Module({ imports: [PrismaModule], controllers: [ContenuSiteController] })
export class ContenuSiteModule {}
