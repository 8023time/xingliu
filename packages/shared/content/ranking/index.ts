/**
 * 榜单类型。
 */
export type RankingTypeValue = 'hot' | 'viral';

/**
 * 榜单排序方式。
 */
export type RankingSortValue = 'comprehensive' | 'quality' | 'heat' | 'latest';

/**
 * 榜单内容完整字段。
 */
interface RankingItem {
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
  publishedAt: string | null;
  reason: string;
  coverUrl: string | null;
}

/**
 * 榜单权重字段。
 */
interface RankingWeights {
  quality: number;
  heat: number;
  freshness: number;
  interaction: number;
}

/**
 * 榜单分页查询字段。
 */
interface RankingQuery {
  cursor: string | null;
  limit: number;
  sort: RankingSortValue;
}

/**
 * 榜单分页响应字段。
 */
interface RankingPage {
  items: RankingItemResponse[];
  nextCursor: string | null;
  hasMore: boolean;
  rankingType: RankingTypeValue;
  sort: RankingSortValue;
  weights: RankingWeights;
}

/**
 * 榜单内容返回记录。
 */
export type RankingItemResponse = RankingItem;

/**
 * 榜单分页查询参数。
 */
export type RankingQueryRequest = Partial<RankingQuery>;

/**
 * 榜单分页响应。
 */
export type RankingPageResponse = RankingPage;
