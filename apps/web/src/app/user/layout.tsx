'use client';

import { useEffect, useState, type ReactNode } from 'react';
import AccountLayout from '@/components/layout/AccountLayout';
import { LoginRequired, UserPageSkeleton } from '@/features/user';
import { useAuthDialogStore } from '@/stores/auth-dialog-store';
import { useAuthStore } from '@/stores/user-store';

export default function UserLayout({ children }: { children: ReactNode }) {
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

  return <AccountLayout user={user}>{children}</AccountLayout>;
}
