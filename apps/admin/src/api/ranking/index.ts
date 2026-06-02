import type { ResponseFormat } from '@xingliu/shared/common';
import type { RankingPageResponse, RankingSortValue, RankingTypeValue } from '@xingliu/shared/content/ranking';
import http from '@/configs/request';

export interface RankingQuery {
  cursor?: string | null;
  limit?: number;
  sort?: RankingSortValue;
}

export async function getRankingApi(
  rankingType: RankingTypeValue,
  query: RankingQuery,
): Promise<ResponseFormat<RankingPageResponse>> {
  return http.get(`/ranking/${rankingType}`, {
    params: {
      cursor: query.cursor ?? undefined,
      limit: query.limit,
      sort: query.sort,
    },
  });
}
