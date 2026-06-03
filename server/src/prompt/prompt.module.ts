import { Module } from '@nestjs/common';
import { PromptService } from './prompt.service';
import { PromptController } from './prompt.controller';

@Module({
  controllers: [PromptController],
  providers: [PromptService],
})
export class PromptModule {}
