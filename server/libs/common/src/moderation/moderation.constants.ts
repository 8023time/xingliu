import type { ModerationRiskLevel } from './moderation.types';

export const MODERATION_PROVIDERS = {
  localRule: 'mint_filter',
  aliyunGreen: 'aliyun_green',
} as const;

export const LOCAL_HIGH_RISK_LABEL = 'local_high_risk';

export const LOCAL_CONTEXT_RISK_LABEL = 'local_context_risk';

export const MODERATION_RISK_SCORES: Record<ModerationRiskLevel, number> = {
  none: 100,
  low: 80,
  medium: 50,
  high: 0,
};
