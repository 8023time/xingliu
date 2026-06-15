import type { ResponseFormat } from '@xingliu/shared/common';
import { buildApiUrl } from '@/lib/api-url';
import type { PublicContentItem } from '../types';

export const PUBLIC_CONTENT_REVALIDATE_SECONDS = 60;

export async function fetchPublicContent(id: string) {
  const response = await fetch(buildApiUrl(`/api/public/contents/${id}`), {
    next: { revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('公开内容加载失败');

  return ((await response.json()) as ResponseFormat<PublicContentItem>).data;
}
