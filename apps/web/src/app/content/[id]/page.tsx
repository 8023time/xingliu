import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { ArrowLeft, Share2, Sparkles } from 'lucide-react';
import { fetchPublicContent } from '@/features/content/api/detail';
import { getContentCoverUrl } from '@/features/content/cover';
import { ContentLikeButton } from '@/features/content/like-button';
import { ContentViewMetric } from '@/features/content/view-metric';
import { formatNumber, getPublishedLabel } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await fetchPublicContent(id);
  if (!item) notFound();
  const coverUrl = getContentCoverUrl(item.id, item.coverUrl);

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
      {/* 返回按钮 - 移到卡片上方，更符合标准文章页布局 */}
      <div className="mb-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-950"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          返回首页
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-zinc-200/50">
        {/* 封面图区域 - 增加了悬浮微放大动画 */}
        <div className="group/cover relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-rose-50 to-zinc-100">
          <Image
            src={coverUrl}
            alt={item.publishedVersion.title}
            fill
            priority
            sizes="(min-width: 1024px) 896px, 100vw"
            className="h-full w-full object-cover transition-transform duration-500 group-hover/cover:scale-[1.02]"
          />
        </div>

        <div className="p-6 sm:p-10 lg:p-12">
          {/* 标题与摘要 */}
          <div className="space-y-4">
            <h1 className="sm:text-3.5xl text-2xl leading-tight font-bold tracking-tight text-zinc-900 lg:text-4xl">
              {item.publishedVersion.title}
            </h1>
            {item.publishedVersion.summary && (
              <p className="border-l-2 border-zinc-300 pl-4 text-base leading-7 text-zinc-500 italic sm:text-lg">
                {item.publishedVersion.summary}
              </p>
            )}
          </div>

          {/* 作者与发布时间 */}
          <div className="mt-8 flex items-center justify-between gap-4 border-t border-zinc-100 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-zinc-100 ring-1 ring-zinc-950/5">
                <span className="text-sm font-semibold text-zinc-700">
                  {item.author.username.slice(0, 1).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium text-zinc-900">{item.author.username}</div>
                <div className="text-xs text-zinc-400">{getPublishedLabel(item.publishedAt)}</div>
              </div>
            </div>
          </div>

          {/* 文章正文 - 强烈建议安装 @tailwindcss/typography 并使用 prose 类 */}
          {/* 如果没安装，下面的 generic 样式也做了基础美化 */}
          <div className="prose prose-zinc mt-8 max-w-none border-t border-zinc-100 pt-8 text-[16px] leading-relaxed whitespace-pre-wrap text-zinc-800">
            {/* 💡 优化建议：如果 item.publishedVersion.body 是 HTML，建议直接使用 dangerouslySetInnerHTML */}
            {/* <div dangerouslySetInnerHTML={{ __html: item.publishedVersion.body }} /> */}
            {toPlainText(item.publishedVersion.body)}
          </div>

          {/* 数据指标 - 手机端改为 2 列布局，大屏 4 列，视觉更丰满 */}
          <div className="mt-12 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-8 sm:grid-cols-4">
            <ContentViewMetric contentId={item.id} initialViewCount={item.metrics.viewCount} />
            <ContentLikeButton
              contentId={item.id}
              initialLiked={!!item.viewer?.liked}
              initialLikeCount={item.metrics.likeCount}
            />
            <Metric icon={<Share2 />} label="分享" value={formatNumber(item.metrics.shareCount)} />
            <Metric
              icon={<Sparkles className="text-amber-500" />}
              label="质量分"
              value={item.qualityScore ?? '-'}
              isHighlight={!!item.qualityScore}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

// 保留原有的干净文本转换
function toPlainText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// 优化的指标卡片组件
function Metric({
  icon,
  label,
  value,
  isHighlight = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  isHighlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3.5 transition-colors ${
        isHighlight ? 'border-amber-100/70 bg-amber-50/40' : 'border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50'
      }`}
    >
      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 [&_svg]:size-3.5">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-xl font-bold tracking-tight text-zinc-900">{value}</div>
    </div>
  );
}
