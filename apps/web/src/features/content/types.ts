import type { ContentType } from '@xingliu/shared/content';

export type { ContentType };

export type ContentCategory = 'all' | ContentType;

export interface PublicContentItem {
  id: string;
  contentType: ContentType;
  publishedAt: string;
  qualityLevel: string | null;
  qualityScore: string | null;
  safetyScore: string | null;
  coverUrl: string | null;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  metrics: {
    viewCount: number;
    likeCount: number;
    shareCount: number;
    collectCount: number;
  };
  viewer?: {
    liked: boolean;
  };
  publishedVersion: {
    id: string;
    versionNo: number;
    title: string;
    summary: string | null;
    body: string;
    bodyJson: Record<string, unknown> | null;
    assetIds: string[] | null;
  };
}

export interface PublicFeedResponse {
  items: PublicContentItem[];
  nextCursor?: string | null;
  hasMore?: boolean;
}

export const categoryTabs: { id: string; value: ContentCategory; label: string }[] = [
  { id: 'all', value: 'all', label: '全部' },
  { id: 'article', value: 'ARTICLE', label: '长文' },
  { id: 'image-text', value: 'IMAGE_TEXT', label: '短图文' },
  { id: 'short-post', value: 'SHORT_POST', label: '短内容' },
];
