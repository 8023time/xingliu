export type RankingKind = 'hot' | 'viral';
export type RankingAudience = 'public' | 'creator';

export interface RankingWeights {
  quality: number;
  heat: number;
  freshness: number;
  interaction: number;
}

export interface RankingItem {
  id: string;
  title: string;
  summary: string | null;
  contentType: string;
  authorName: string;
  qualityScore: number;
  heatScore: number;
  freshnessScore: number;
  interactionScore: number;
  rankingScore: number;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  collectCount: number;
  publishedAt: Date | string | null;
  reason: string;
  coverUrl: string | null;
}
