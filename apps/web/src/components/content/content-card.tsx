import Image from 'next/image';
import Link from 'next/link';
import { Eye, Heart, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ContentItem, formatNumber, getPublishedLabel } from '@/lib/content-data';
import { cn } from '@/lib/utils';

const ratioClass = {
  portrait: 'aspect-[3/4]',
  square: 'aspect-square',
  wide: 'aspect-[4/3]',
};

export function ContentCard({ item, compact = false }: { item: ContentItem; compact?: boolean }) {
  return (
    <article className="break-inside-avoid overflow-hidden rounded-[18px] bg-white shadow-sm ring-1 ring-zinc-950/[0.04] transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/content/${item.id}`} className="block">
        <div className={cn('relative overflow-hidden bg-zinc-100', ratioClass[item.imageRatio])}>
          <Image src={item.cover} alt={item.title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
          <Badge className="absolute left-2 top-2 bg-white/90 text-zinc-700 backdrop-blur">{categoryLabel[item.category]}</Badge>
        </div>
      </Link>

      <div className={cn('space-y-3 p-3', compact && 'space-y-2')}>
        <Link href={`/content/${item.id}`} className="block">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-6 text-zinc-950">{item.title}</h3>
          {!compact && <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{item.excerpt}</p>}
        </Link>

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-6">
              <AvatarImage src={item.author.avatar} alt={item.author.name} />
              <AvatarFallback>{item.author.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-xs text-zinc-500">{item.author.name}</span>
          </div>
          <span className="shrink-0 text-xs text-zinc-400">{getPublishedLabel(item.publishedAt)}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" />
            {formatNumber(item.readCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3.5" />
            {formatNumber(item.likeCount)}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#fff1f3] px-2 py-1 font-medium text-[#e73d52]">
            <Sparkles className="size-3.5" />
            {item.qualityScore}
          </span>
        </div>
      </div>
    </article>
  );
}

export const categoryLabel: Record<ContentItem['category'], string> = {
  beauty: '美妆',
  travel: '旅行',
  food: '美食',
  tech: '科技',
  life: '生活',
};
