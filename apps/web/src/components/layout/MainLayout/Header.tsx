'use client';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DropdownMenu, Flex, Text } from '@radix-ui/themes';
import { useAuthDialogStore } from '@/stores/auth-dialog-store';
import { useAuthStore } from '@/stores/user-store';

const LazyAuthDialog = dynamic(() => import('@/components/auth').then((mod) => mod.AuthDialog), {
  ssr: false,
  loading: () => null,
});

export default function Header() {
  const authDialogOpen = useAuthDialogStore((state) => state.open);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 h-16 bg-[#dff1ff]">
        <div className="max-w-page mx-auto h-full w-full px-4 lg:px-0">
          <Flex align="center" justify="between" className="h-full">
            <Link
              href="/"
              aria-label="星流首页"
              className="group flex min-w-0 shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
            >
              <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" priority />
              <span className="flex min-w-0 items-center gap-2">
                <Text as="span" weight="bold" className="truncate text-xl leading-none text-[#17376b]">
                  星流
                </Text>
                <span className="hidden h-3.5 w-px bg-[#9fc7f2] sm:block" />
                <Text as="span" size="2" weight="medium" className="hidden truncate text-[#4f719c] sm:inline">
                  AI 内容发现
                </Text>
              </span>
            </Link>
            <UserHeader />
          </Flex>
        </div>
      </header>

      {authDialogOpen ? <LazyAuthDialog /> : null}
    </>
  );
}

function UserHeader() {
  const router = useRouter();
  const openAuth = useAuthDialogStore((state) => state.openAuth);
  const { isLogin, user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName = user?.username || user?.phone || '星流用户';
  const avatarSrc = user?.avatarUrl ?? '';
  const displayInitial = useMemo(() => displayName.trim().slice(0, 1).toUpperCase() || '星', [displayName]);

  const handleProfileClick = () => {
    router.push('/user');
  };

  const handleLoginClick = () => {
    openAuth('login');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="shrink-0">
      {mounted && isLogin ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="hidden h-9 rounded-full px-4 text-sm font-medium text-[#264b7d] transition-colors hover:bg-[#cfe9ff] hover:text-[#1f66e5] sm:inline-flex sm:items-center"
            onClick={handleProfileClick}
          >
            个人中心
          </button>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <button
                type="button"
                className="relative flex size-9 items-center justify-center overflow-hidden rounded-full bg-[#cfe9ff] text-sm font-semibold text-[#264b7d] transition-colors hover:bg-[#c3e2ff]"
                title={displayName}
                aria-label={`${displayName} 的用户菜单`}
              >
                {avatarSrc ? (
                  <Image src={avatarSrc} alt={displayName} fill sizes="36px" className="object-cover" />
                ) : (
                  <span>{displayInitial}</span>
                )}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" className="min-w-28">
              <DropdownMenu.Item
                color="red"
                onClick={(event) => {
                  event.stopPropagation();
                  handleLogout();
                }}
              >
                退出登录
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      ) : (
        <button
          type="button"
          className="h-9 rounded-full bg-white px-5 text-sm font-medium transition-colors hover:bg-[#cfe9ff]"
          onClick={handleLoginClick}
        >
          登录/注册
        </button>
      )}
    </div>
  );
}
