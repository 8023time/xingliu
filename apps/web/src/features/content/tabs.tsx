'use client';

import { useMemo, useState } from 'react';
import { ArticleCard } from '@/features/content/card';
import { fetchPublicFeedPage } from '@/features/content/api/feed';
import type { ContentCategory, PublicContentItem } from '@/features/content/types';
import { cn } from '@/lib/class-name';

const contentTabs: { id: string; label: string; value: ContentCategory }[] = [
  { id: 'all', label: '全部', value: 'all' },
  { id: 'article', label: '长文章', value: 'ARTICLE' },
  { id: 'short-post', label: '短笔记', value: 'SHORT_POST' },
  { id: 'image-text', label: '图文', value: 'IMAGE_TEXT' },
];

export function ArticleContentTabs({
  errorMessage,
  initialHasMore,
  initialItems,
  initialNextCursor,
  pageSize,
}: {
  errorMessage: string;
  initialHasMore: boolean;
  initialItems: PublicContentItem[];
  initialNextCursor: string | null;
  pageSize: number;
}) {
  const [items, setItems] = useState(initialItems);
  const [activeTab, setActiveTab] = useState(contentTabs[0].id);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState('');

  const activeCategory = contentTabs.find((tab) => tab.id === activeTab)?.value ?? 'all';
  const visibleItems = useMemo(
    () => items.filter((item) => activeCategory === 'all' || item.contentType === activeCategory),
    [activeCategory, items],
  );

  const loadMore = async () => {
    if (!hasMore || loadingMore || !nextCursor) return;

    setLoadingMore(true);
    setLoadMoreError('');
    try {
      const page = await fetchPublicFeedPage({ limit: pageSize, cursor: nextCursor });
      setItems((currentItems) => {
        const mergedItems = [...currentItems, ...page.items];
        return Array.from(new Map(mergedItems.map((item) => [item.id, item])).values());
      });
      setNextCursor(page.nextCursor ?? null);
      setHasMore(!!page.hasMore);
    } catch {
      setLoadMoreError('加载更多失败，请稍后重试');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 gap-4 overflow-x-auto">
          {contentTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={cn(
                'h-9 shrink-0 cursor-pointer rounded-xl px-4 text-sm font-medium transition-colors',
                activeTab === tab.id ? 'bg-zinc-100 text-zinc-950' : 'bg-transparent text-zinc-500 hover:text-zinc-950',
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 grid min-w-0 grid-cols-1 gap-x-6 gap-y-8 px-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-3">
        {visibleItems.map((item) => (
          <ArticleCard key={item.id} item={item} />
        ))}
      </div>

      {!visibleItems.length && (
        <div className="mx-5 rounded-xl border border-dashed border-zinc-200 py-16 text-center text-xs text-zinc-400">
          {errorMessage || '暂无已发布内容'}
        </div>
      )}

      <div className="px-4 py-8 text-center sm:px-5">
        {loadMoreError ? <p className="mb-3 text-xs text-rose-500">{loadMoreError}</p> : null}
        {hasMore ? (
          <button
            type="button"
            className="h-10 rounded-full bg-white px-5 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loadingMore || !nextCursor}
            onClick={loadMore}
          >
            {loadingMore ? '加载中...' : '加载更多'}
          </button>
        ) : items.length ? (
          <p className="text-xs text-zinc-300">已加载全部</p>
        ) : null}
      </div>
    </>
  );
}
