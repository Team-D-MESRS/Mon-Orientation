import { Module } from '@nestjs/common';
import { OrientationModule } from '../orientation/orientation.module';
import { ApprenantController } from './apprenant.controller';
import { ApprenantService } from './apprenant.service';

@Module({
  imports: [OrientationModule],
  controllers: [ApprenantController],
  providers: [ApprenantService],
})
export class ApprenantModule {}
