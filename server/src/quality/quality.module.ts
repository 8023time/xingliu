import { Module } from '@nestjs/common';
import { QualityService } from './quality.service';
import { QualityController } from './quality.controller';

@Module({
  controllers: [QualityController],
  providers: [QualityService],
})
export class QualityModule {}
