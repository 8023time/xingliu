'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Edit3, Heart, LogOut, Settings, Sparkles, UserRound } from 'lucide-react';
import { ContentCard } from '@/components/content/content-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { creators, getUserWorks } from '@/lib/content-data';
import { useAuthDialogStore } from '@/stores/auth-dialog-store';

export default function UserPage() {
  const openAuth = useAuthDialogStore((state) => state.openAuth);
  const profile = creators[0];
  const works = getUserWorks();

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[30px] bg-white shadow-sm ring-1 ring-zinc-950/[0.04]">
        <div className="relative h-36 bg-[linear-gradient(135deg,#ffe3e8,#fff7f8,#fefefe)]">
          <Image
            src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
            alt="个人主页背景"
            fill
            sizes="100vw"
            className="object-cover opacity-25"
          />
        </div>
        <div className="px-4 pb-5 sm:px-6">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar className="size-24 border-4 border-white shadow-md">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback>{profile.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="pb-2">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{profile.name}</h1>
                <p className="mt-1 text-sm text-zinc-500">{profile.title}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-full bg-white" onClick={() => openAuth('login')}>
                <UserRound className="size-4" />
                登录同步
              </Button>
              <Button className="rounded-full bg-[#ff4d62] hover:bg-[#ef4054]">
                <Edit3 className="size-4" />
                编辑资料
              </Button>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600">{profile.bio}</p>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center sm:max-w-md">
            <Stat label="关注者" value={profile.followers} />
            <Stat label="获赞" value="4.8w" />
            <Stat label="作品" value={String(works.length)} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">我的作品</h2>
              <p className="text-sm text-zinc-500">展示已发布内容和近期表现</p>
            </div>
            <Badge className="rounded-full bg-[#fff1f3] text-[#e73d52]">内容创作者</Badge>
          </div>
          <div className="columns-2 gap-3 space-y-3 sm:columns-3">
            {works.map((item) => (
              <ContentCard key={item.id} item={item} compact />
            ))}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-zinc-950/[0.04]">
            <h3 className="font-semibold text-zinc-950">创作状态</h3>
            <div className="mt-4 space-y-3 text-sm">
              <ProfileAction icon={<Sparkles />} title="平均质量分" value="88.6" />
              <ProfileAction icon={<Heart />} title="近 7 日互动" value="+18%" />
              <ProfileAction icon={<Settings />} title="账号偏好" value="已配置" />
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start rounded-2xl bg-white text-zinc-500">
            <LogOut className="size-4" />
            退出登录
          </Button>
          <Button variant="outline" className="w-full rounded-2xl bg-white" asChild>
            <Link href="/explore">继续发现内容</Link>
          </Button>
        </aside>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-zinc-50 px-3 py-3">
      <div className="text-lg font-semibold text-zinc-950">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}

function ProfileAction({ icon, title, value }: { icon: ReactNode; title: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-3 py-3">
      <span className="inline-flex items-center gap-2 text-zinc-600 [&_svg]:size-4 [&_svg]:text-[#ff4d62]">
        {icon}
        {title}
      </span>
      <span className="font-medium text-zinc-950">{value}</span>
    </div>
  );
}
