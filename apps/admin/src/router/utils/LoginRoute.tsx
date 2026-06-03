import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/user-store';

export default function LoginRoute() {
  const { isLogin } = useAuthStore();

  // 如果用户已登录，重定向到首页
  if (isLogin) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
