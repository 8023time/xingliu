import type { RankingPageResponse, RankingQueryRequest, RankingTypeValue } from '@xingliu/shared/content/ranking';
import type { ResponseFormat } from '@xingliu/shared/common';
import http from '@/configs/request';

export type {
  RankingItemResponse,
  RankingPageResponse,
  RankingQueryRequest,
  RankingSortValue,
  RankingTypeValue,
} from '@xingliu/shared/content/ranking';

/**
 * 获取内容榜单接口
 * GET /api/ranking/:rankingType
 */
export async function getRankingApi(
  rankingType: RankingTypeValue,
  query: RankingQueryRequest,
): Promise<ResponseFormat<RankingPageResponse>> {
  return http.get(`/ranking/${rankingType}`, {
    params: {
      cursor: query.cursor ?? undefined,
      limit: query.limit,
      sort: query.sort,
    },
  });
}
