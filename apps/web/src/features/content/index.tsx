'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Eye, Heart } from 'lucide-react';
import backgroundImage from '@/assets/image/background.jpg';
import { fetchPublicFeed } from '@/features/content/api/feed';
import { getContentCoverUrl } from '@/features/content/cover';
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
    <section className="relative isolate min-h-[240px] overflow-hidden rounded-xl bg-zinc-900 shadow-sm lg:min-h-[300px]">
      <Image
        src={backgroundImage}
        alt="星流内容发现"
        fill
        priority
        sizes="(min-width: 1280px) 584px, 100vw"
        className="object-cover opacity-95 transition-transform duration-700 hover:scale-[1.01]"
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
    <section className="min-w-0 overflow-hidden bg-transparent" aria-labelledby="content-feed-title">
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
          {error || '暂无已发布内容'}
        </div>
      )}
    </section>
  );
}

export function ArticleCard({ item }: { item: PublicContentItem }) {
  const coverUrl = getContentCoverUrl(item.id, item.coverUrl);

  return (
    <Link
      href={`/content/${item.id}`}
      className="group block min-w-0 overflow-hidden rounded-xl bg-white p-3 transition-all duration-300 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-zinc-50">
        <img
          src={coverUrl}
          alt={item.publishedVersion.title}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>

      <div className="mt-3 min-w-0 px-1">
        <div className="mb-2 flex min-w-0 items-center gap-2 text-[11px] text-zinc-400">
          <span className="rounded-md bg-zinc-50 px-1.5 py-0.5 font-medium text-zinc-500">
            {getContentTypeLabel(item.contentType)}
          </span>
          <span className="truncate">{getPublishedLabel(item.publishedAt)}</span>
        </div>

        <h3 className="line-clamp-1 text-[15px] leading-snug font-medium text-zinc-800 transition-colors duration-150 group-hover:text-[#e73d52]">
          {item.publishedVersion.title}
        </h3>

        <p className="mt-1 line-clamp-1 text-xs font-normal text-zinc-400">{item.publishedVersion.summary}</p>

        <div className="mt-3.5 flex min-w-0 items-center justify-between gap-3 border-t border-zinc-50 pt-2.5 text-[11px] text-zinc-400">
          <span className="min-w-0 truncate font-medium text-zinc-500">{item.author.username}</span>

          <div className="flex shrink-0 items-center gap-3 font-mono">
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Eye className="size-3 text-zinc-300" />
              {formatNumber(item.metrics.viewCount)}
            </span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Heart className="size-3 text-zinc-300" />
              {formatNumber(item.metrics.likeCount)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
