import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/user-store';

export default function AuthRoute() {
  const { isLogin } = useAuthStore();
  const location = useLocation();

  // 如果用户未登录，重定向到登录页，并携带当前路径以便登录后跳转回来
  if (!isLogin) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  // 如果用户已登录,但是访问了/login路径,重定向到主页
  if (location.pathname === '/login' && isLogin) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
