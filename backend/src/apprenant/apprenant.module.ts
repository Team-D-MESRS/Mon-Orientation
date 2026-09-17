import { Module } from '@nestjs/common';
import { OrientationModule } from '../orientation/orientation.module';
import { FiliereModule } from '../filiere/filiere.module';
import { ApprenantController } from './apprenant.controller';
import { ApprenantService } from './apprenant.service';

@Module({
  imports: [OrientationModule, FiliereModule],
  controllers: [ApprenantController],
  providers: [ApprenantService],
})
export class ApprenantModule {}
