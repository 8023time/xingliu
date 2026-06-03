import { Module } from '@nestjs/common';
import { AiService } from './ai.service';

@Module({
  providers: [AiService]
})
export class AiModule {}
