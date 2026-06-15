import Image from 'next/image';
import backgroundImage from '@/assets/image/background.jpg';
import { ArticleContentTabs } from '@/features/content/tabs';
import type { PublicContentItem } from '@/features/content/types';
export { ArticleCard } from '@/features/content/card';

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

export function ArticleContent({
  errorMessage = '',
  initialHasMore,
  initialItems,
  initialNextCursor,
  pageSize,
}: {
  errorMessage?: string;
  initialHasMore: boolean;
  initialItems: PublicContentItem[];
  initialNextCursor: string | null;
  pageSize: number;
}) {
  return (
    <section className="min-w-0 overflow-hidden bg-transparent" aria-labelledby="content-feed-title">
      <ArticleContentTabs
        errorMessage={errorMessage}
        initialHasMore={initialHasMore}
        initialItems={initialItems}
        initialNextCursor={initialNextCursor}
        pageSize={pageSize}
      />
    </section>
  );
}
