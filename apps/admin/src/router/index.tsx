import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazyComponent } from './utils/lazy-component';
import AuthRoute from './utils/AuthRoute';
import RouteError from '@/components/ui/RouteError';
import RankingsPage from '@/pages/rankings';

const router = createBrowserRouter([
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
      {
        path: '/login',
        element: lazyComponent(() => import('@/pages/login')),
        errorElement: <RouteError />,
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
