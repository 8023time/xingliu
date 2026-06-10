'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Eye, Flame, Trophy } from 'lucide-react';
import { fetchRanking } from '@/features/ranking/api/ranking';
import { cn } from '@/lib/class-name';
import { formatNumber, getPublishedLabel } from '@/lib/format';
import type { RankingItem, RankingType } from './types';

export function HotArticle() {
  return <RankingPanel title="热点榜" type="hot" icon={<Flame className="size-4" />} />;
}

export function HotTopic() {
  return <RankingPanel title="爆文榜" type="viral" icon={<Trophy className="size-4" />} />;
}

function RankingPanel({ title, type, icon }: { title: string; type: RankingType; icon: ReactNode }) {
  const [items, setItems] = useState<RankingItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetchRanking(type, { limit: 6 })
      .then((rankingItems) => {
        setItems(rankingItems);
        setError('');
      })
      .catch(() => setError('榜单加载失败，请稍后重试'));
  }, [type]);

  return (
    <aside className="rounded-[8px] bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-base font-semibold text-zinc-950">
            <span className="grid size-7 place-items-center rounded-full bg-[#fff1f3] text-[#e73d52]">{icon}</span>
            {title}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {items.slice(0, 6).map((item, index) => (
          <Link
            key={`${type}-${item.id}`}
            href={`/content/${item.id}`}
            className="group flex min-h-14 items-center gap-3 rounded-[6px] px-2 py-2 transition-colors hover:bg-zinc-50"
          >
            <span
              className={cn(
                'grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold',
                index < 3 ? 'bg-[#ff4d62] text-white' : 'bg-zinc-100 text-zinc-500',
              )}
            >
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 text-sm font-medium text-zinc-900 group-hover:text-[#e73d52]">
                {item.title}
              </span>
              <span className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                <Eye className="size-3" />
                {formatNumber(item.viewCount)}
                <span className="h-1 w-1 rounded-full bg-zinc-300" />
                {getPublishedLabel(item.publishedAt)}
              </span>
            </span>
          </Link>
        ))}
      </div>

      {!items.length && (
        <div className="rounded-[6px] bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">
          {error || '暂无榜单内容'}
        </div>
      )}
    </aside>
  );
}
