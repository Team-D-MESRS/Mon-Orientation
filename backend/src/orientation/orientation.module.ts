import { Module } from '@nestjs/common';
import { OrientationController } from './orientation.controller';
import { OrientationService } from './orientation.service';
import { ApprenantModule } from '../apprenant/apprenant.module';
import { FiliereModule } from '../filiere/filiere.module';

@Module({
  imports: [ApprenantModule, FiliereModule],
  controllers: [OrientationController],
  providers: [OrientationService],
})
export class OrientationModule {}
