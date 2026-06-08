import { Injectable } from '@nestjs/common';
import { AliyunGreenModerationProvider } from './providers/aliyun-green-moderation.provider';
import { LocalRuleModerationProvider } from './providers/local-rule-moderation.provider';
import { LOCAL_CONTEXT_RISK_LABEL } from './moderation.constants';
import type { AssetModerationResult, ModerationRiskSpan, TextModerationResult } from './moderation.types';

@Injectable()
export class ModerationService {
  constructor(
    private readonly localRuleModerationProvider: LocalRuleModerationProvider,
    private readonly aliyunGreenModerationProvider: AliyunGreenModerationProvider,
  ) {}

  async moderateImage(imageUrl: string): Promise<AssetModerationResult> {
    const result = await this.aliyunGreenModerationProvider.moderate({
      kind: 'image',
      imageUrl,
    });

    return {
      riskLevel: result.riskLevel,
      labels: result.labels,
      reason: result.reason,
      provider: result.provider,
      requestId: result.requestId,
      rawOutput: result.rawOutput,
    };
  }

  async moderateText(text: string): Promise<TextModerationResult> {
    const localResult = await this.localRuleModerationProvider.moderate({
      kind: 'text',
      text,
    });

    if (localResult) {
      return {
        riskLevel: localResult.riskLevel,
        labels: localResult.labels,
        reason: localResult.reason,
        provider: localResult.provider,
        requestId: localResult.requestId,
        riskSpans: localResult.riskSpans,
        rawOutput: localResult.rawOutput,
      };
    }

    const contextRiskSpans = this.localRuleModerationProvider.scanContextRisk(text);
    const result = await this.aliyunGreenModerationProvider.moderate({
      kind: 'text',
      text,
      contextRiskSpans,
    });

    return {
      riskLevel: result.riskLevel,
      labels: contextRiskSpans.length ? uniqueStrings([...result.labels, LOCAL_CONTEXT_RISK_LABEL]) : result.labels,
      reason: result.reason,
      provider: result.provider,
      requestId: result.requestId,
      riskSpans: contextRiskSpans.length ? mergeRiskSpans(result.riskSpans, contextRiskSpans) : result.riskSpans,
      rawOutput: contextRiskSpans.length
        ? {
            provider: result.rawOutput,
            localContextRisk: {
              riskSpans: contextRiskSpans,
            },
          }
        : result.rawOutput,
    };
  }
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function mergeRiskSpans(providerSpans: ModerationRiskSpan[], contextSpans: ModerationRiskSpan[]) {
  const seen = new Set<string>();
  const spans: ModerationRiskSpan[] = [];

  for (const span of [...providerSpans, ...contextSpans]) {
    const key = `${span.index}:${span.text}`;
    if (!seen.has(key)) {
      seen.add(key);
      spans.push(span);
    }
  }

  return spans.sort((left, right) => left.index - right.index);
}
