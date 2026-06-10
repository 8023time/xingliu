import type { ContentType } from '@xingliu/shared/content';

export function formatNumber(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}w`;
  return value.toLocaleString('zh-CN');
}

export function getPublishedLabel(value: string | null) {
  if (!value) return '-';

  const published = new Date(value);
  const hours = Math.max(1, Math.round((Date.now() - published.getTime()) / 36e5));
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.round(hours / 24)} 天前`;
}

export function getContentTypeLabel(value: ContentType) {
  return { ARTICLE: '长文', IMAGE_TEXT: '短图文', SHORT_POST: '短内容' }[value];
}
