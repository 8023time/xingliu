import { Module } from '@nestjs/common';
import { AiGenerationService } from './ai-generation.service';
import { AiGenerationController } from './ai-generation.controller';

@Module({
  controllers: [AiGenerationController],
  providers: [AiGenerationService],
})
export class AiGenerationModule {}
