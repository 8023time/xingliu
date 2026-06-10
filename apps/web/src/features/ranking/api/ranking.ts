import type { RankingQueryRequest } from '@xingliu/shared/content/ranking';
import type { ResponseFormat } from '@xingliu/shared/common';
import { buildApiUrl } from '@/lib/api-url';
import type { RankingPage, RankingType } from '../types';

export async function fetchRankingPage(type: RankingType, params: RankingQueryRequest = {}): Promise<RankingPage> {
  const searchParams = new URLSearchParams();
  searchParams.set('limit', String(params.limit ?? 50));
  if (params.cursor) searchParams.set('cursor', params.cursor);
  if (params.sort) searchParams.set('sort', params.sort);

  const response = await fetch(buildApiUrl(`/api/rankings/${type}?${searchParams.toString()}`), { cache: 'no-store' });
  if (!response.ok) throw new Error('榜单加载失败');

  return ((await response.json()) as ResponseFormat<RankingPage>).data;
}

export async function fetchRanking(type: RankingType, params: RankingQueryRequest = {}) {
  return (await fetchRankingPage(type, params)).items;
}
