import Link from 'next/link';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { ArrowLeft, Eye, Heart, Share2, Sparkles } from 'lucide-react';
import { fetchPublicContent } from '@/features/content/api/detail';
import { formatNumber, getPublishedLabel } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await fetchPublicContent(id);
  if (!item) notFound();

  return (
    <article className="mx-auto max-w-5xl">
      <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-zinc-950/[0.04]">
        <div className="aspect-[16/8] bg-gradient-to-br from-rose-50 to-zinc-100">
          {item.coverUrl && (
            <img src={item.coverUrl} alt={item.publishedVersion.title} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="space-y-5 p-4 sm:p-7">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full px-0 text-zinc-500 transition-colors hover:text-zinc-700"
          >
            <ArrowLeft className="size-4" />
            返回首页
          </Link>

          <div className="space-y-3">
            <h1 className="text-3xl leading-tight font-semibold tracking-tight text-zinc-950">
              {item.publishedVersion.title}
            </h1>
            <p className="text-base leading-7 text-zinc-500">{item.publishedVersion.summary}</p>
          </div>

          <div className="border-border flex items-center justify-between gap-4 border-y py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="bg-muted flex size-11 items-center justify-center rounded-full">
                <span className="text-sm font-medium">{item.author.username.slice(0, 1)}</span>
              </div>
              <div className="min-w-0">
                <div className="font-medium text-zinc-950">{item.author.username}</div>
                <div className="text-xs text-zinc-500">{getPublishedLabel(item.publishedAt)}</div>
              </div>
            </div>
          </div>

          <div className="text-[15px] leading-8 whitespace-pre-wrap text-zinc-700">
            {toPlainText(item.publishedVersion.body)}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Metric icon={<Eye />} label="阅读" value={formatNumber(item.metrics.viewCount)} />
            <Metric icon={<Heart />} label="点赞" value={formatNumber(item.metrics.likeCount)} />
            <Metric icon={<Share2 />} label="分享" value={formatNumber(item.metrics.shareCount)} />
            <Metric icon={<Sparkles />} label="质量分" value={item.qualityScore ?? '-'} />
          </div>
        </div>
      </div>
    </article>
  );
}

function toPlainText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-zinc-50 px-3 py-3">
      <div className="inline-flex items-center gap-1 text-xs text-zinc-500 [&_svg]:size-3.5">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-zinc-950">{value}</div>
    </div>
  );
}
