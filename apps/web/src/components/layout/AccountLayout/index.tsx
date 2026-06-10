'use client';

import { type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Grid, Card, Flex, Avatar, Heading, Text, ScrollArea, Box } from '@radix-ui/themes';
import type { AuthUser } from '@/features/user/types';

interface AccountLayoutProps {
  user: AuthUser;
  children: ReactNode;
  publishedCount?: number;
}

export default function AccountLayout({ user, children, publishedCount = 0 }: AccountLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Grid columns={{ initial: '1', lg: '264px minmax(0, 1fr)' }} gap={{ initial: '4' }}>
      <AccountSidebar
        user={user}
        activeSection={pathname}
        onSectionChange={(to) => router.push(to)}
        publishedCount={publishedCount}
      />
      <Card size="3" className="overflow-hidden rounded-xl bg-white !p-0">
        <ScrollArea type="hover" scrollbars="vertical" className="h-full w-full" style={{ maxHeight: '740px' }}>
          <Box className="p-5 sm:p-6 lg:p-7">{children}</Box>
        </ScrollArea>
      </Card>
    </Grid>
  );
}

interface MenuItem {
  to: string;
  label: string;
  badge?: number;
  children?: Omit<MenuItem, 'children'>[];
}

const menuConfig: MenuItem[] = [
  {
    to: '/user/profile',
    label: '个人信息',
  },
  {
    to: '/user/public/all',
    label: '我的发布',
    children: [
      { to: '/user/public/all', label: '全部' },
      { to: '/user/public/long-form', label: '长文章' },
      { to: '/user/public/short-notes', label: '短笔记' },
      { to: '/user/public/images', label: '图文' },
    ],
  },
];

interface AccountSidebarProps {
  user: AuthUser;
  activeSection: string;
  onSectionChange: (section: string) => void;
  publishedCount?: number;
}

export function AccountSidebar({ user, activeSection, onSectionChange, publishedCount = 0 }: AccountSidebarProps) {
  const displayName = user.username || user.phone || '星流用户';
  const initial = displayName.trim().slice(0, 1).toUpperCase() || '星';

  return (
    <aside className="h-fit w-64 shrink-0">
      <Card size="3" className="flex min-h-[680px] flex-col overflow-hidden !bg-white !p-0">
        <Box className="p-4 pb-0">
          <Flex align="center" gap="3" className="mb-6 border-b border-zinc-100 pb-6">
            <Avatar
              size="4"
              src={user.avatarUrl ?? undefined}
              fallback={initial}
              radius="full"
              className="shrink-0 !bg-[#dff1ff] font-bold !text-[#17376b] shadow-inner ring-4 ring-blue-50/50"
            />
            <Box className="min-w-0">
              <Heading as="h1" size="3" className="truncate font-bold text-zinc-900">
                {displayName}
              </Heading>
              {user.phone && (
                <Text size="1" className="mt-1 block truncate text-zinc-400">
                  手机号：{user.phone}
                </Text>
              )}
            </Box>
          </Flex>
        </Box>

        {/* 导航菜单 - 使用配置渲染 */}
        <Box className="flex-1 space-y-1 px-3">
          {menuConfig.map((item) => (
            <MenuGroup
              key={item.to}
              item={item}
              activeSection={activeSection}
              publishedCount={publishedCount}
              onSectionChange={onSectionChange}
            />
          ))}
        </Box>
      </Card>
    </aside>
  );
}

function MenuGroup({
  item,
  activeSection,
  publishedCount,
  onSectionChange,
}: {
  item: MenuItem;
  activeSection: string;
  publishedCount: number;
  onSectionChange: (section: string) => void;
}) {
  const isActive = item.children ? activeSection.startsWith('/user/public') : activeSection === item.to;

  if (item.children) {
    return (
      <div className="mb-2">
        <button
          type="button"
          onClick={() => onSectionChange(item.to)}
          className="flex w-full items-center justify-between rounded-md px-3 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          aria-current={isActive ? 'page' : undefined}
        >
          <span>{item.label}</span>
          <span className="text-zinc-400">{'>'}</span>
        </button>

        <div className="ml-3 space-y-0.5 border-l border-zinc-100 pl-4">
          {item.children.map((child) => (
            <NavItem
              key={child.to}
              label={child.label}
              active={activeSection === child.to}
              onClick={() => onSectionChange(child.to)}
              badge={child.to === '/user/public/all' && publishedCount > 0 ? publishedCount : undefined}
            />
          ))}
        </div>
      </div>
    );
  }

  return <NavItem label={item.label} active={isActive} onClick={() => onSectionChange(item.to)} badge={item.badge} />;
}

function NavItem({
  label,
  active,
  onClick,
  badge,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm transition-all ${
        active ? 'bg-[#eef4ff] font-semibold text-[#17376b]' : 'text-zinc-600 hover:bg-zinc-50'
      }`}
    >
      <span>{label}</span>
      {badge !== undefined && (
        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-600">{badge}</span>
      )}
    </button>
  );
}
