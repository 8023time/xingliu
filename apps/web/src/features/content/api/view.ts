import type { ResponseFormat } from '@xingliu/shared/common';
import type { ContentViewStateResponse } from '@xingliu/shared/content';

const pendingViewRequests = new Map<string, Promise<ContentViewStateResponse>>();

export function recordContentView({
  accessToken,
  contentId,
}: {
  accessToken?: string;
  contentId: string;
}): Promise<ContentViewStateResponse> {
  const pendingRequest = pendingViewRequests.get(contentId);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = fetch(`/api/proxy/api/public/contents/${contentId}/view`, {
    method: 'POST',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })
    .then(async (response) => {
      const result = (await response.json()) as ResponseFormat<ContentViewStateResponse>;

      if (!response.ok || result.code !== 0) {
        throw new Error(result.message || '记录浏览失败');
      }

      return result.data;
    })
    .finally(() => {
      if (pendingViewRequests.get(contentId) === request) {
        pendingViewRequests.delete(contentId);
      }
    });

  pendingViewRequests.set(contentId, request);
  return request;
}
