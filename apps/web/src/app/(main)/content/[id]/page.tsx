import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { ArrowLeft, Eye, Heart, Share2, Sparkles } from 'lucide-react';
import { ContentCard } from '@/components/content/content-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { contents, formatNumber, getContentById, getPublishedLabel } from '@/lib/content-data';

export default async function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getContentById(id);

  if (!item) notFound();

  const related = contents
    .filter((content) => content.id !== item.id && content.category === item.category)
    .slice(0, 3);

  return (
    <article className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-zinc-950/[0.04]">
        <div className="relative aspect-[4/3] bg-zinc-100 sm:aspect-[16/10]">
          <Image
            src={item.cover}
            alt={item.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 900px"
            className="object-cover"
          />
        </div>
        <div className="space-y-5 p-4 sm:p-7">
          <Button variant="ghost" className="rounded-full px-0 text-zinc-500" asChild>
            <Link href="/explore">
              <ArrowLeft className="size-4" />
              返回发现
            </Link>
          </Button>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-full">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl leading-tight font-semibold tracking-tight text-zinc-950">{item.title}</h1>
            <p className="text-base leading-7 text-zinc-500">{item.excerpt}</p>
          </div>

          <div className="border-border flex items-center justify-between gap-4 border-y py-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="size-11">
                <AvatarImage src={item.author.avatar} alt={item.author.name} />
                <AvatarFallback>{item.author.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-medium text-zinc-950">{item.author.name}</div>
                <div className="text-xs text-zinc-500">
                  {item.author.title} · {getPublishedLabel(item.publishedAt)}
                </div>
              </div>
            </div>
            <Button className="rounded-full bg-[#ff4d62] hover:bg-[#ef4054]">关注</Button>
          </div>

          <div className="space-y-4 text-[15px] leading-8 text-zinc-700">
            {item.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {item.gallery.map((image) => (
              <div key={image} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-100">
                <Image
                  src={image}
                  alt={`${item.title} 配图`}
                  fill
                  sizes="(max-width: 768px) 100vw, 280px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-zinc-950/[0.04]">
          <h2 className="font-semibold text-zinc-950">内容表现</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric icon={<Eye />} label="阅读" value={formatNumber(item.readCount)} />
            <Metric icon={<Heart />} label="点赞" value={formatNumber(item.likeCount)} />
            <Metric icon={<Share2 />} label="分享" value={formatNumber(item.shareCount)} />
            <Metric icon={<Sparkles />} label="质量分" value={String(item.qualityScore)} />
          </div>
          <p className="mt-4 rounded-2xl bg-[#fff7f8] px-3 py-3 text-xs leading-5 text-[#b83245]">
            质量分 {item.qualityScore}，阅读热度 {formatNumber(item.readCount)}
            ，发布时间较新，具备进入榜单的综合优势。
          </p>
        </div>

        {!!related.length && (
          <div className="space-y-3">
            <h2 className="px-1 font-semibold text-zinc-950">相关内容</h2>
            {related.map((content) => (
              <ContentCard key={content.id} item={content} compact />
            ))}
          </div>
        )}
      </aside>
    </article>
  );
}

export function generateStaticParams() {
  return contents.map((item) => ({ id: item.id }));
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
