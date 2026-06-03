'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowUpRight, Clock3, Eye, Heart, Share2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatNumber, getPublishedLabel, getRankingItems, RankingType } from '@/lib/content-data';
import { cn } from '@/lib/utils';

const pageSize = 4;

export function RankingBoard() {
  const [type, setType] = useState<RankingType>('hot');
  const [visible, setVisible] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const rankingItems = useMemo(() => getRankingItems(type), [type]);
  const items = rankingItems.slice(0, visible);
  const hasMore = visible < rankingItems.length;

  useEffect(() => {
    setVisible(pageSize);
  }, [type]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.setTimeout(() => setVisible((current) => Math.min(current + pageSize, rankingItems.length)), 240);
        }
      },
      { rootMargin: '280px' },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, rankingItems.length]);

  return (
    <section className="space-y-5">
      <div className="rounded-[28px] bg-zinc-950 px-5 py-6 text-white sm:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge className="bg-white/10 text-white ring-1 ring-white/15">实时分发榜</Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">内容热度正在上升</h1>
            <p className="text-sm leading-6 text-white/65">
              综合内容质量分、阅读热度、发布时间和互动增长，展示近期最值得关注的内容。
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/75 ring-1 ring-white/15">
            缓存更新：2026-06-02 23:00
          </div>
        </div>
      </div>

      <Tabs value={type} onValueChange={(value) => setType(value as RankingType)}>
        <TabsList className="h-11 rounded-2xl bg-white p-1 shadow-sm">
          <TabsTrigger value="hot" className="h-9 rounded-xl px-5">
            热点榜
          </TabsTrigger>
          <TabsTrigger value="viral" className="h-9 rounded-xl px-5">
            爆文榜
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-[22px] bg-white p-3 shadow-sm ring-1 ring-zinc-950/[0.04]">
            <div className="flex gap-3">
              <Link href={`/content/${item.id}`} className="relative h-32 w-28 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 sm:h-40 sm:w-36">
                <Image src={item.cover} alt={item.title} fill sizes="160px" className="object-cover" />
                <span
                  className={cn(
                    'absolute left-2 top-2 grid size-8 place-items-center rounded-full text-sm font-bold text-white',
                    item.rank <= 3 ? 'bg-[#ff4d62]' : 'bg-zinc-950/70',
                  )}
                >
                  {item.rank}
                </span>
              </Link>

              <div className="min-w-0 flex-1 py-1">
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full">
                    综合分 {item.score}
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    质量 {item.qualityScore}
                  </Badge>
                </div>
                <Link href={`/content/${item.id}`}>
                  <h2 className="line-clamp-2 text-base font-semibold leading-6 text-zinc-950">{item.title}</h2>
                </Link>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-500">{item.excerpt}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-500 sm:grid-cols-4">
                  <Metric icon={<Eye />} value={formatNumber(item.readCount)} />
                  <Metric icon={<Heart />} value={formatNumber(item.likeCount)} />
                  <Metric icon={<Share2 />} value={formatNumber(item.shareCount)} />
                  <Metric icon={<Clock3 />} value={getPublishedLabel(item.publishedAt)} />
                </div>
                <p className="mt-3 rounded-2xl bg-[#fff7f8] px-3 py-2 text-xs leading-5 text-[#b83245]">{item.reason}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div ref={sentinelRef} className="flex min-h-20 items-center justify-center">
        {hasMore ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-zinc-500 shadow-sm">
            <Sparkles className="size-4 text-[#ff4d62]" />
            加载更多榜单内容
          </span>
        ) : (
          <Button variant="ghost" className="rounded-full text-zinc-500" asChild>
            <Link href="/explore">
              去发现更多内容
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}

function Metric({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 [&_svg]:size-3.5">
      {icon}
      {value}
    </span>
  );
}
