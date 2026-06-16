import type { ResponseFormat } from '@xingliu/shared/common';
import type { ContentLikeStateResponse } from '@xingliu/shared/content';
import { authenticatedFetch } from '@/features/user/api/authenticated-fetch';

export async function updateContentLikeState({
  contentId,
  liked,
}: {
  contentId: string;
  liked: boolean;
}): Promise<ContentLikeStateResponse> {
  const response = await authenticatedFetch(`/api/proxy/api/public/contents/${contentId}/like`, {
    method: liked ? 'POST' : 'DELETE',
  });

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  const result = (await response.json()) as ResponseFormat<ContentLikeStateResponse>;

  if (!response.ok || result.code !== 0) {
    throw new Error(result.message || '点赞操作失败');
  }

  return result.data;
}
