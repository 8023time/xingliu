import { Injectable } from '@nestjs/common';
import type { ModerationDecision, ModerationRiskLevel } from '../moderation.types';

@Injectable()
export class ModerationDecisionStrategy {
  decide(riskLevel: ModerationRiskLevel): ModerationDecision {
    if (riskLevel === 'high') return 'reject';
    if (riskLevel === 'medium') return 'need_rewrite';
    return 'pass';
  }
}
