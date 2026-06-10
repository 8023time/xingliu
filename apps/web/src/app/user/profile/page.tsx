'use client';

import { UserInfoPanel } from '@/features/user';
import { useAuthStore } from '@/stores/user-store';

export default function UserProfilePage() {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  return <UserInfoPanel user={user} />;
}
