import { createElement, lazy, Suspense, type ComponentType, type ReactNode } from 'react';

export function lazyComponent(
  importFunc: () => Promise<{ default: ComponentType }>,
  fallbackComponent?: ReactNode,
): ReactNode {
  const LazyComponent = lazy(async () => {
    try {
      return await importFunc();
    } catch (error) {
      await new Promise((resolve) => window.setTimeout(resolve, 300));
      return importFunc().catch(() => {
        throw error;
      });
    }
  });

  return createElement(Suspense, { fallback: fallbackComponent ?? null }, createElement(LazyComponent));
}
