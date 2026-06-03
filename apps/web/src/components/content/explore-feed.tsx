'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { categoryTabs, getFeedItems } from '@/lib/content-data';
import { cn } from '@/lib/utils';
import { ContentCard } from './content-card';

export function ExploreFeed() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get('q') ?? '';
  const [activeTabId, setActiveTabId] = useState(categoryTabs[0].id);
  const activeCategory = categoryTabs.find((tab) => tab.id === activeTabId)?.value ?? 'all';

  const items = useMemo(() => getFeedItems(activeCategory, keyword), [activeCategory, keyword]);

  return (
    <section className="space-y-4">
      <div className="-mx-3 border-b border-transparent bg-white px-3 pb-5 md:mx-0 md:px-0">
        <div className="mx-auto flex max-w-4xl items-center justify-start gap-6 overflow-x-auto md:justify-center">
          {categoryTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                'relative h-8 shrink-0 text-sm font-medium text-zinc-500 transition hover:text-zinc-950',
                activeTabId === tab.id && 'font-semibold text-zinc-950 after:absolute after:inset-x-1 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-[#ff2442]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {keyword && (
        <div className="flex items-center gap-2 px-1 text-sm text-zinc-500">
          搜索结果
          <Badge variant="secondary" className="rounded-full">
            {keyword}
          </Badge>
        </div>
      )}

      <div className="columns-2 gap-3 space-y-3 md:columns-3 lg:columns-4 xl:columns-5">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>

      {!items.length && (
        <div className="rounded-3xl bg-white px-6 py-16 text-center text-sm text-zinc-500">没有找到相关内容</div>
      )}
    </section>
  );
}
