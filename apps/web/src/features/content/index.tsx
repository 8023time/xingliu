'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Eye, Heart, NotebookText } from 'lucide-react';
import backgroundImage from '@/assets/image/background.jpg';
import { fetchPublicFeed } from '@/features/content/api/feed';
import type { ContentCategory, PublicContentItem } from '@/features/content/types';
import { cn } from '@/lib/class-name';
import { formatNumber, getContentTypeLabel, getPublishedLabel } from '@/lib/format';

const contentTabs: { id: string; label: string; value: ContentCategory }[] = [
  { id: 'all', label: '全部', value: 'all' },
  { id: 'article', label: '长文章', value: 'ARTICLE' },
  { id: 'short-post', label: '短笔记', value: 'SHORT_POST' },
  { id: 'image-text', label: '图文', value: 'IMAGE_TEXT' },
];

export function ContentHeroBanner() {
  return (
    <section className="relative isolate min-h-[280px] overflow-hidden rounded-[8px] bg-zinc-900 shadow-sm lg:min-h-[356px]">
      <Image
        src={backgroundImage}
        alt="星流内容发现"
        fill
        priority
        sizes="(min-width: 1280px) 584px, 100vw"
        className="object-cover"
      />
    </section>
  );
}

export function ArticleContent() {
  const [items, setItems] = useState<PublicContentItem[]>([]);
  const [activeTab, setActiveTab] = useState(contentTabs[0].id);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetchPublicFeed({ limit: 30 })
      .then((feed) => {
        setItems(feed);
        setError('');
      })
      .catch(() => setError('内容加载失败，请稍后重试'));
  }, []);

  const activeCategory = contentTabs.find((tab) => tab.id === activeTab)?.value ?? 'all';
  const visibleItems = useMemo(
    () => items.filter((item) => activeCategory === 'all' || item.contentType === activeCategory),
    [activeCategory, items],
  );

  return (
    <section className="overflow-hidden rounded-[8px] bg-white" aria-labelledby="content-feed-title">
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex gap-2 overflow-x-auto">
          {contentTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={cn(
                'h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-zinc-950 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950',
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item) => (
          <ArticleCard key={item.id} item={item} />
        ))}
      </div>

      {!visibleItems.length && (
        <div className="px-6 py-16 text-center text-sm text-zinc-500">{error || '暂无已发布内容'}</div>
      )}
    </section>
  );
}

export function ArticleCard({ item }: { item: PublicContentItem }) {
  return (
    <Link href={`/content/${item.id}`} className="group block p-4 transition-colors hover:bg-zinc-50 sm:p-5">
      <div className="flex gap-4">
        <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-[8px] bg-zinc-100">
          {item.coverUrl ? (
            <img
              src={item.coverUrl}
              alt={item.publishedVersion.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-rose-50 to-zinc-100 text-zinc-300">
              <NotebookText className="size-7" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600">
              {getContentTypeLabel(item.contentType)}
            </span>
            <span>{getPublishedLabel(item.publishedAt)}</span>
          </div>
          <h3 className="line-clamp-2 text-base leading-6 font-semibold text-zinc-950 group-hover:text-[#e73d52]">
            {item.publishedVersion.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-500">{item.publishedVersion.summary}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3.5" />
              {formatNumber(item.metrics.viewCount)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="size-3.5" />
              {formatNumber(item.metrics.likeCount)}
            </span>
            <span className="ml-auto text-zinc-500">{item.author.username}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
