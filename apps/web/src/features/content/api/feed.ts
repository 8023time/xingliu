import type { PublicFeedQueryRequest } from '@xingliu/shared/content';
import type { ResponseFormat } from '@xingliu/shared/common';
import { buildApiUrl } from '@/lib/api-url';
import type { PublicFeedResponse } from '../types';

const PUBLIC_FEED_REVALIDATE_SECONDS = 30;

export async function fetchPublicFeedPage(params: PublicFeedQueryRequest = {}): Promise<PublicFeedResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('limit', String(params.limit ?? 50));
  if (params.cursor) searchParams.set('cursor', params.cursor);

  const response = await fetch(buildApiUrl(`/api/feed?${searchParams.toString()}`), {
    next: { revalidate: PUBLIC_FEED_REVALIDATE_SECONDS },
  });
  if (!response.ok) throw new Error('公开内容流加载失败');

  return ((await response.json()) as ResponseFormat<PublicFeedResponse>).data;
}

export async function fetchPublicFeed(params: PublicFeedQueryRequest = {}) {
  return (await fetchPublicFeedPage(params)).items;
}
