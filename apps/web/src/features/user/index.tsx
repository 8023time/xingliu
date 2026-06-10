'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, CalendarDays, FileText, Mail, Phone, UserRound } from 'lucide-react';
import AccountLayout from '@/components/layout/AccountLayout';
import { ArticleCard } from '@/features/content';
import { fetchPublicFeed } from '@/features/content/api/feed';
import type { ContentCategory, PublicContentItem } from '@/features/content/types';
import { getContentTypeLabel } from '@/lib/format';
import { useAuthDialogStore } from '@/stores/auth-dialog-store';
import { useAuthStore } from '@/stores/user-store';
import type { AuthUser } from './types';

type AccountSection = 'info' | 'published';

export default function User() {
  const openAuth = useAuthDialogStore((state) => state.openAuth);
  const { isLogin, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <UserPageSkeleton />;
  }

  if (!isLogin || !user) {
    return <LoginRequired onLogin={() => openAuth('login')} />;
  }

  return <AccountCenter user={user} />;
}

function AccountCenter({ user }: { user: AuthUser }) {
  const [activeSection, _setActiveSection] = useState<AccountSection>('info');
  const [activeCategory, _setActiveCategory] = useState<ContentCategory>('all');
  const [items, setItems] = useState<PublicContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    void fetchPublicFeed({ limit: 50 })
      .then((feed) => {
        if (cancelled) return;
        setItems(feed.filter((item) => item.author.id === user.id));
        setError('');
      })
      .catch(() => {
        if (cancelled) return;
        setError('发布内容加载失败，请稍后重试');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const visibleItems = useMemo(
    () => items.filter((item) => activeCategory === 'all' || item.contentType === activeCategory),
    [activeCategory, items],
  );

  return (
    <AccountLayout user={user} publishedCount={items.length}>
      {activeSection === 'info' ? (
        <UserInfoPanel user={user} />
      ) : (
        <PublishedPanel items={visibleItems} loading={loading} error={error} activeCategory={activeCategory} />
      )}
    </AccountLayout>
  );
}

export function UserInfoPanel({ user }: { user: AuthUser }) {
  const fields = [
    { label: '用户 ID', value: user.id, icon: BadgeCheck },
    { label: '用户名', value: user.username, icon: UserRound },
    { label: '手机号', value: user.phone, icon: Phone },
    { label: '邮箱', value: user.email || '-', icon: Mail },
    { label: '账号状态', value: getStatusLabel(user.status), icon: BadgeCheck },
    { label: '注册时间', value: formatDateTime(user.createdAt), icon: CalendarDays },
    { label: '更新时间', value: formatDateTime(user.updatedAt), icon: CalendarDays },
  ];

  return (
    <div className="min-w-0">
      <SectionTitle title="详细信息" />

      <div className="mt-5 overflow-hidden rounded-xl border border-zinc-100 bg-[#f8fbff]">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {fields.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.label} className="min-w-0 border-b border-zinc-100 bg-white/70 p-4 sm:odd:border-r">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                  <Icon className="size-4 text-[#6d95c7]" />
                  {field.label}
                </div>
                <div className="mt-2 min-h-6 text-sm leading-6 font-semibold break-all text-zinc-900">
                  {field.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PublishedPanel({
  items,
  loading,
  error,
  activeCategory,
}: {
  items: PublicContentItem[];
  loading: boolean;
  error: string;
  activeCategory: ContentCategory;
}) {
  const categoryLabel = activeCategory === 'all' ? '全部' : getContentTypeLabel(activeCategory);

  return (
    <div className="min-w-0">
      <SectionTitle title={`${categoryLabel}`} />

      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-xl bg-white p-3 ring-1 ring-zinc-100">
              <div className="aspect-[16/10] animate-pulse rounded-lg bg-zinc-100" />
              <div className="mt-4 h-4 w-4/5 animate-pulse rounded bg-zinc-100" />
              <div className="mt-3 h-3 w-3/5 animate-pulse rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      ) : items.length ? (
        <div className="mt-6 grid min-w-0 grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ArticleCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-[#f8fbff] px-6 text-center">
          <FileText className="size-10 text-zinc-300" />
          <p className="mt-4 text-sm font-semibold text-zinc-800">{error || '暂无发布内容'}</p>
          <p className="mt-2 text-xs leading-5 text-zinc-500">公开发布后的文章会展示在这里。</p>
        </div>
      )}
    </div>
  );
}

export function LoginRequired({ onLogin }: { onLogin: () => void }) {
  return (
    <section className="mx-auto max-w-xl rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-zinc-950/[0.04]">
      <UserRound className="mx-auto size-10 text-zinc-400" />
      <h1 className="mt-4 text-xl font-semibold text-zinc-950">暂未登录，请先登录/注册</h1>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          className="h-11 rounded-full bg-[#ff4d62] px-6 text-sm font-medium text-white transition-colors hover:bg-[#ef4054]"
          onClick={onLogin}
        >
          登录
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
        >
          返回首页
        </Link>
      </div>
    </section>
  );
}

export function UserPageSkeleton() {
  return (
    <div className="max-w-page mx-auto grid w-full grid-cols-1 gap-4 md:grid-cols-[184px_minmax(0,1fr)] lg:grid-cols-[216px_minmax(0,1fr)] lg:gap-8">
      <div className="h-80 animate-pulse rounded-xl bg-white/70" />
      <div className="h-[520px] animate-pulse rounded-xl bg-white/70" />
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-b border-zinc-100 pb-4">
      <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
    </div>
  );
}

function getStatusLabel(status: AuthUser['status']) {
  return { ACTIVE: '正常', DISABLED: '已禁用', DELETED: '已注销' }[status] ?? status;
}

function formatDateTime(value?: string) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
