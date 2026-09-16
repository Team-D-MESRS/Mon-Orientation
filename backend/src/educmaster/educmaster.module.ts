import { Module } from '@nestjs/common';
import { EducMasterService } from './educmaster.service';

@Module({
  providers: [EducMasterService],
  exports: [EducMasterService],
})
export class EducMasterModule {}
