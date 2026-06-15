'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Eye, Heart } from 'lucide-react';
import { getContentCoverUrl } from '@/features/content/cover';
import type { PublicContentItem } from '@/features/content/types';
import { formatNumber, getContentTypeLabel, getPublishedLabel } from '@/lib/format';

export function ArticleCard({ item }: { item: PublicContentItem }) {
  const coverUrl = getContentCoverUrl(item.id, item.coverUrl);

  return (
    <Link
      href={`/content/${item.id}`}
      className="group block min-w-0 overflow-hidden rounded-xl bg-white p-3 transition-all duration-300 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-zinc-50">
        <Image
          src={coverUrl}
          alt={item.publishedVersion.title}
          fill
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
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
