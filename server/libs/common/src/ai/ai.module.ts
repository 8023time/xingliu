import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ContentGenerationAiService } from './content-generation-ai.service';
import { QualityAiService } from './quality-ai.service';
import { RewriteAiService } from './rewrite-ai.service';

@Module({
  providers: [AiService, ContentGenerationAiService, QualityAiService, RewriteAiService],
  exports: [AiService, ContentGenerationAiService, QualityAiService, RewriteAiService],
})
export class AiModule {}
