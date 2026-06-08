import type { ModerationProviderInput, ModerationProviderResult } from '../moderation.types';

export interface ModerationProvider {
  moderate(input: ModerationProviderInput): Promise<ModerationProviderResult | null>;
}
