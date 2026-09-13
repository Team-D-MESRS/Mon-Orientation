import { Module } from '@nestjs/common';
import { FiliereModule } from '../filiere/filiere.module';
import { OrientationModule } from '../orientation/orientation.module';
import { ConseillerController } from './conseiller.controller';
import { ConseillerService } from './conseiller.service';
import { OutilsConseillerService } from './outils-conseiller';

@Module({
  imports: [FiliereModule, OrientationModule],
  controllers: [ConseillerController],
  providers: [ConseillerService, OutilsConseillerService],
})
export class ConseillerModule {}
