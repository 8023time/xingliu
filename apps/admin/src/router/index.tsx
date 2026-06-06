import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazyComponent } from './utils/lazy-component';
import AuthRoute from './utils/AuthRoute';
import LoginRoute from './utils/LoginRoute';
import RouteError from '@/components/ui/RouteError';
import RankingsPage from '@/pages/rankings';

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
        element: lazyComponent(() => import('@/components/layout/RootLayout')),
        errorElement: <RouteError />,
        children: [
          {
            index: true,
            element: <Navigate to="/home" replace />,
          },
          {
            path: 'home',
            element: lazyComponent(() => import('@/pages/home')),
          },
          {
            path: 'rankings',
            element: <RankingsPage />,
          },
          {
            path: 'prompts',
            element: lazyComponent(() => import('@/pages/prompts')),
          },
          {
            path: 'assets',
            element: lazyComponent(() => import('@/pages/assets')),
          },
          {
            path: '/content',
            children: [
              {
                path: 'list',
                element: lazyComponent(() => import('@/pages/content/list')),
              },
              {
                path: 'create',
                element: lazyComponent(() => import('@/pages/content/create')),
              },
            ],
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
