import { Module } from '@nestjs/common';
import { ConseillerController } from './conseiller.controller';
import { ConseillerService } from './conseiller.service';

@Module({
  controllers: [ConseillerController],
  providers: [ConseillerService],
})
export class ConseillerModule {}
