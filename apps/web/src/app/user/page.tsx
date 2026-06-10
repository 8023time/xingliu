'use client';

import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { useAuthDialogStore } from '@/stores/auth-dialog-store';

export default function UserPage() {
  const openAuth = useAuthDialogStore((state) => state.openAuth);

  return (
    <section className="mx-auto max-w-xl rounded-[28px] bg-white px-6 py-16 text-center shadow-sm ring-1 ring-zinc-950/[0.04]">
      <UserRound className="mx-auto size-10 text-zinc-400" />
      <h1 className="mt-4 text-xl font-semibold text-zinc-950">用户中心暂未开放</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-500">当前核心版本聚焦已发布内容流、榜单和公开详情。</p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          className="h-10 rounded-full bg-[#ff4d62] px-6 text-sm font-medium text-white transition-colors hover:bg-[#ef4054]"
          onClick={() => openAuth('login')}
        >
          登录
        </button>
        <Link
          href="/"
          className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center rounded-full border px-6 text-sm font-medium transition-colors"
        >
          返回首页
        </Link>
      </div>
    </section>
  );
}
