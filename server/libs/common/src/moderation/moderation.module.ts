import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { AliyunGreenModerationProvider } from './providers/aliyun-green-moderation.provider';
import { LocalRuleModerationProvider } from './providers/local-rule-moderation.provider';
import { ModerationDecisionStrategy } from './strategies/moderation-decision.strategy';

@Module({
  providers: [
    ModerationService,
    ModerationDecisionStrategy,
    LocalRuleModerationProvider,
    AliyunGreenModerationProvider,
  ],
  exports: [ModerationService],
})
export class ModerationModule {}
