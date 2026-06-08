import { Injectable } from '@nestjs/common';
import Mint from 'mint-filter';
import { CONTEXT_RISK_WORDS, HIGH_RISK_WORDS } from '../dictionaries';
import { LOCAL_HIGH_RISK_LABEL, MODERATION_PROVIDERS } from '../moderation.constants';
import type { ModerationProviderInput, ModerationProviderResult, ModerationRiskSpan } from '../moderation.types';
import type { ModerationProvider } from './moderation-provider.interface';

@Injectable()
export class LocalRuleModerationProvider implements ModerationProvider {
  private readonly highRiskMint = new Mint([...HIGH_RISK_WORDS]);
  private readonly contextRiskMint = new Mint([...CONTEXT_RISK_WORDS]);

  moderate(input: ModerationProviderInput): Promise<ModerationProviderResult | null> {
    if (input.kind !== 'text' || !input.text) return Promise.resolve(null);

    const result = this.highRiskMint.filter(input.text, { replace: false });
    if (!result.words.length) return Promise.resolve(null);

    const riskSpans = this.toRiskSpans(input.text, result.words);

    return Promise.resolve({
      riskLevel: 'high',
      labels: [LOCAL_HIGH_RISK_LABEL],
      reason: '命中本地高风险敏感词',
      provider: MODERATION_PROVIDERS.localRule,
      riskSpans,
      rawOutput: {
        words: result.words,
        riskSpans,
      },
    });
  }

  scanContextRisk(text: string): ModerationRiskSpan[] {
    const result = this.contextRiskMint.filter(text, { replace: false });
    if (!result.words.length) return [];
    return this.toRiskSpans(text, result.words);
  }

  private toRiskSpans(text: string, words: string[]): ModerationRiskSpan[] {
    const normalizedText = text.toLowerCase();
    const seen = new Set<string>();
    const spans: ModerationRiskSpan[] = [];

    for (const word of words) {
      const normalizedWord = word.toLowerCase();
      let index = normalizedText.indexOf(normalizedWord);

      while (index >= 0) {
        const key = `${index}:${word}`;
        if (!seen.has(key)) {
          seen.add(key);
          spans.push({ index, text: text.slice(index, index + word.length) });
        }
        index = normalizedText.indexOf(normalizedWord, index + Math.max(word.length, 1));
      }
    }

    return spans.sort((left, right) => left.index - right.index);
  }
}
