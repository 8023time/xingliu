export type ModerationRiskLevel = 'none' | 'low' | 'medium' | 'high';

export type ModerationDecision = 'pass' | 'need_rewrite' | 'reject';

export type ModerationSubjectKind = 'text' | 'image';

export interface ModerationRiskSpan {
  index: number;
  text: string;
}

export interface ModerationProviderInput {
  kind: ModerationSubjectKind;
  text?: string;
  imageUrl?: string;
  contextRiskSpans?: ModerationRiskSpan[];
}

export interface ModerationProviderResult {
  riskLevel: ModerationRiskLevel;
  labels: string[];
  reason?: string;
  provider: string;
  requestId?: string;
  riskSpans: ModerationRiskSpan[];
  rawOutput: unknown;
}

export interface AssetModerationResult {
  riskLevel: ModerationRiskLevel;
  labels: string[];
  reason?: string;
  provider: string;
  requestId?: string;
  rawOutput: unknown;
}

export interface TextModerationResult extends AssetModerationResult {
  riskSpans: ModerationRiskSpan[];
}
