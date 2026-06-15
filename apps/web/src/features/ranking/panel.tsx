'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Eye, Flame, Trophy } from 'lucide-react';
import { fetchRankingPage } from '@/features/ranking/api/ranking';
import { cn } from '@/lib/class-name';
import { formatNumber, getPublishedLabel } from '@/lib/format';
import type { RankingItem, RankingPage, RankingType } from './types';

const rankingConfig = {
  hot: {
    title: '热点榜',
    icon: Flame,
    activeText: 'group-hover:text-rose-500',
    rankColors: ['text-rose-500', 'text-rose-400', 'text-rose-300'],
  },
  viral: {
    title: '爆文榜',
    icon: Trophy,
    activeText: 'group-hover:text-amber-600',
    rankColors: ['text-amber-600', 'text-amber-500', 'text-amber-400'],
  },
} satisfies Record<
  RankingType,
  {
    title: string;
    icon: typeof Flame;
    activeText: string;
    rankColors: string[];
  }
>;

export function RankingPanel({
  errorMessage,
  initialPage,
  pageSize,
  type,
}: {
  errorMessage: string;
  initialPage: RankingPage;
  pageSize: number;
  type: RankingType;
}) {
  const config = rankingConfig[type];
  const Icon = config.icon;
  const [items, setItems] = useState<RankingItem[]>(initialPage.items);
  const [nextCursor, setNextCursor] = useState<string | null>(initialPage.nextCursor);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(errorMessage);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingRef.current || !nextCursor) return;

    loadingRef.current = true;
    setLoading(true);
    try {
      const page = await fetchRankingPage(type, {
        limit: pageSize,
        cursor: nextCursor,
      });
      setItems((currentItems) => {
        const nextItems = [...currentItems, ...page.items];
        return Array.from(new Map(nextItems.map((item) => [item.id, item])).values());
      });
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
      setError('');
    } catch {
      setError('榜单加载失败，请稍后重试');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hasMore, nextCursor, pageSize, type]);

  const renderItem = useCallback(
    (index: number, item: RankingItem) => {
      const isTopThree = index < 3;

      return (
        <Link
          key={`${type}-${item.id}`}
          href={`/content/${item.id}`}
          className="group flex items-baseline gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-zinc-50/80"
        >
          <span
            className={cn(
              'w-4 shrink-0 text-center text-xs font-bold tracking-tighter italic',
              isTopThree ? config.rankColors[index] : 'font-sans font-medium text-zinc-300 not-italic',
            )}
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          <span className="min-w-0 flex-1">
            <span
              className={cn(
                'line-clamp-1 text-[13px] font-normal text-zinc-700 transition-colors duration-150',
                config.activeText,
              )}
            >
              {item.title}
            </span>

            <span className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="flex items-center gap-0.5">
                <Eye className="size-2.5 shrink-0 text-zinc-300" />
                {formatNumber(item.viewCount)}
              </span>
              <span className="size-0.5 rounded-full bg-zinc-200" />
              <span>{getPublishedLabel(item.publishedAt)}</span>
            </span>
          </span>
        </Link>
      );
    },
    [config.activeText, config.rankColors, type],
  );

  const renderFooter = useCallback(() => {
    if (loading) {
      return <div className="py-2 text-center text-[11px] text-zinc-400">加载中...</div>;
    }

    if (error && items.length > 0) {
      return <div className="py-2 text-center text-[11px] text-zinc-400">{error}</div>;
    }

    if (!hasMore && items.length > 0) {
      return <div className="py-2 text-center text-[11px] text-zinc-300">已加载全部</div>;
    }

    return null;
  }, [error, hasMore, items.length, loading]);

  return (
    <aside className="overflow-hidden rounded-lg bg-transparent bg-white p-2 pb-10 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
          <span className="text-zinc-400">
            <Icon className="size-3" />
          </span>
          {config.title}
        </div>
        <span className="origin-right scale-90 text-[10px] tracking-wider text-zinc-400 uppercase select-none">
          HOT
        </span>
      </div>

      {items.length > 0 ? (
        <Virtuoso
          className="h-[260px] overflow-y-auto"
          data={items}
          endReached={loadMore}
          itemContent={renderItem}
          components={{ Footer: renderFooter }}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-200/60 py-8 text-center text-[11px] text-zinc-400">
          {error || '暂无数据'}
        </div>
      )}
    </aside>
  );
}
