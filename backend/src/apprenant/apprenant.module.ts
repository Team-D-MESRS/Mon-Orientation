import { Module } from '@nestjs/common';
import { ApprenantController } from './apprenant.controller';
import { ApprenantService } from './apprenant.service';

@Module({
  controllers: [ApprenantController],
  providers: [ApprenantService],
  exports: [ApprenantService],
})
export class ApprenantModule {}
