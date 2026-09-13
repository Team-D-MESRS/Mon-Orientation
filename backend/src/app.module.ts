import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ApprenantModule } from './apprenant/apprenant.module';
import { FiliereModule } from './filiere/filiere.module';
import { OrientationModule } from './orientation/orientation.module';
import { ConseillerModule } from './conseiller/conseiller.module';
import { StatsModule } from './stats/stats.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    ApprenantModule,
    FiliereModule,
    OrientationModule,
    ConseillerModule,
    StatsModule,
  ],
})
export class AppModule {}
