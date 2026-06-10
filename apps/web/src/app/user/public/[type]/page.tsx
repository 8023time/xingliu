'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchPublicFeed } from '@/features/content/api/feed';
import type { ContentCategory, PublicContentItem } from '@/features/content/types';
import { PublishedPanel } from '@/features/user';
import { useAuthStore } from '@/stores/user-store';

const routeCategoryMap: Record<string, ContentCategory> = {
  all: 'all',
  'long-form': 'ARTICLE',
  'short-notes': 'SHORT_POST',
  images: 'IMAGE_TEXT',
};

export default function UserPublicPage() {
  const params = useParams<{ type: string }>();
  const user = useAuthStore((state) => state.user);
  const activeCategory = routeCategoryMap[params.type] ?? 'all';
  const [items, setItems] = useState<PublicContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    setLoading(true);
    void fetchPublicFeed({ limit: 50 })
      .then((feed) => {
        if (cancelled) return;
        setItems(feed.filter((item) => item.author.id === user.id));
        setError('');
      })
      .catch(() => {
        if (cancelled) return;
        setError('发布内容加载失败，请稍后重试');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const visibleItems = useMemo(
    () => items.filter((item) => activeCategory === 'all' || item.contentType === activeCategory),
    [activeCategory, items],
  );

  if (!user) return null;

  return <PublishedPanel items={visibleItems} loading={loading} error={error} activeCategory={activeCategory} />;
}
