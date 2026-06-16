'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/class-name';
import { Config } from '@xingliu/config';

type NavClickType = 'internal' | 'external';

interface NavItemsType {
  to: string;
  clickType: NavClickType;
  label: string;
  matchPath?: (pathname: string) => boolean;
}

const NavItems: NavItemsType[] = [
  {
    to: '/',
    label: '首页',
    clickType: 'internal',
    matchPath: (pathname) => pathname === '/',
  },
  {
    to: `https://${Config.host.prod.admin}`,
    label: '创作者中心',
    clickType: 'external',
  },
  {
    to: '/user',
    label: '个人中心',
    clickType: 'internal',
    matchPath: (pathname) => pathname === '/user' || pathname.startsWith('/user/'),
  },
];

export default function NavTabs() {
  const pathname = usePathname();

  const tabClassName = (active: boolean) =>
    cn(
      'flex h-[30px] min-w-px flex-1 flex-col items-center gap-[11px] text-base leading-4 font-semibold whitespace-nowrap text-[#131737] no-underline transition-colors',
      active ? '' : 'hover:text-[#2367F0]',
    );

  const renderTabContent = (active: boolean, label: string) => (
    <>
      <span>{label}</span>
      {active ? <span className="h-[3px] w-5 shrink-0 rounded-full bg-[#131737]" /> : null}
    </>
  );

  return (
    <nav aria-label="主导航" className="mt-2.5 w-full">
      <div className="max-w-page mx-auto flex w-full items-center gap-6 rounded-xl bg-white px-5 pt-4">
        {NavItems.map((tab) => {
          const active = tab.matchPath?.(pathname) ?? false;
          const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
            if (active) {
              event.preventDefault();
            }
          };

          if (tab.clickType === 'external') {
            return (
              <a
                key={tab.to}
                href={tab.to}
                target="_blank"
                rel="noreferrer"
                className={tabClassName(active)}
                onClick={handleClick}
              >
                {renderTabContent(active, tab.label)}
              </a>
            );
          }

          return (
            <Link key={tab.to} href={tab.to} className={tabClassName(active)} onClick={handleClick}>
              {renderTabContent(active, tab.label)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
