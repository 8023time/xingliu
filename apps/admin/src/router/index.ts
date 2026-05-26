import { createElement } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazyComponent } from './utils/lazy-component';

const router = createBrowserRouter([
  {
    path: '/',
    element: createElement(Navigate, { to: '/login', replace: true }),
  },
  {
    path: '/login',
    element: lazyComponent(() => import('@/pages/login')),
  },
]);

export default router;
