'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, CirclePlay, Home, Plus, Search, SquarePlus, UserRound } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuthDialogStore } from '@/stores/auth-dialog-store';
import { AuthDialog } from './auth-dialog';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { LineLayout } from '@/components/ui/lineLayout';

const navItems = [
  { href: '/explore', label: '首页', icon: Home },
  { href: '/rankings', label: '榜单', icon: CirclePlay },
  { href: '/user', label: '我的', icon: UserRound },
];

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <LineLayout>
      <div className="min-h-dvh">
        <div className="mx-autoa flex">
          <Sidebar />
          <main className="min-w-0 flex-1 px-3 pt-4 pb-24 md:pt-10 md:pb-16">{children}</main>
        </div>
        <AuthDialog />
      </div>
    </LineLayout>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const openAuth = useAuthDialogStore((state) => state.openAuth);

  return (
    <aside className="sticky top-0 flex h-dvh w-[72px] shrink-0 flex-col border-r border-zinc-100 py-4 md:w-[240px] md:px-4 md:py-7">
      <Link href="/explore" className="mb-10 flex justify-center md:justify-start">
        <img src="/logo.png" alt="小红书" className="hidden h-10 w-auto md:block" />
      </Link>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            (item.label === '首页' && pathname.startsWith('/explore')) ||
            (item.label === '榜单' && pathname.startsWith('/rankings')) ||
            (item.label === '我的' && pathname.startsWith('/user'));

          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={cn(
                'flex h-12 items-center justify-center gap-3 rounded-full text-[15px] font-semibold text-zinc-800 transition hover:bg-white md:justify-start md:px-4',
                active && 'bg-white shadow-sm',
              )}
            >
              <Icon className="size-5" />
              <span className="hidden 2xl:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Button
        className="mt-5 hidden h-11 rounded-full bg-[#ff2442] text-sm font-semibold hover:bg-[#f51f3d] md:flex"
        onClick={() => openAuth('login')}
      >
        登录
      </Button>

      <div className="mt-auto flex justify-center pb-2 md:justify-start">
        <Link
          href="/explore"
          className="flex h-10 items-center gap-3 rounded-full px-2 text-sm font-medium text-zinc-700 hover:bg-white md:px-4"
        >
          <Avatar size="sm">
            <AvatarImage src="/avatar.jpg" alt="" />
          </Avatar>
        </Link>
      </div>
    </aside>
  );
}
