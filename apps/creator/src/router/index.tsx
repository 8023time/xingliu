import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazyComponent } from './utils/lazy-component';
import AuthRoute from './utils/AuthRoute';
import LoginRoute from './utils/LoginRoute';
import RouteError from '@/components/ui/RouteError';

// 路由懒加载 [针对菜单路由,配合layout的预加载策略,非菜单路由不适用]
export const routeLoaders = {
  home: () => import('@/pages/home'),
  rankings: () => import('@/pages/rankings'),
  prompts: () => import('@/pages/prompts'),
  assets: () => import('@/pages/assets'),
  contentList: () => import('@/pages/content/list'),
  contentCreate: () => import('@/pages/content/create'),
  info: () => import('@/pages/info'),
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginRoute />,
    errorElement: <RouteError />,
    children: [
      {
        index: true,
        element: lazyComponent(() => import('@/pages/login')),
      },
    ],
  },
  {
    element: <AuthRoute />,
    children: [
      {
        path: '/',
        element: lazyComponent(() => import('@/components/layout/MainLayout')),
        errorElement: <RouteError />,
        children: [
          {
            index: true,
            element: <Navigate to="/home" replace />,
          },
          {
            path: 'home',
            element: lazyComponent(routeLoaders.home),
          },
          {
            path: 'rankings',
            element: lazyComponent(routeLoaders.rankings),
          },
          {
            path: 'prompts',
            element: lazyComponent(routeLoaders.prompts),
          },
          {
            path: 'assets',
            element: lazyComponent(routeLoaders.assets),
          },
          {
            path: '/content',
            children: [
              {
                path: 'list',
                element: lazyComponent(routeLoaders.contentList),
              },
              {
                path: 'create',
                element: lazyComponent(routeLoaders.contentCreate),
              },
            ],
          },
          {
            path: 'info',
            element: lazyComponent(routeLoaders.info),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: lazyComponent(() => import('@/components/ui/404')),
    errorElement: <RouteError />,
  },
]);

export default router;
