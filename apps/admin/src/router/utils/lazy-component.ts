import { createElement, lazy, Suspense, type ComponentType, type ReactNode } from 'react';

export function lazyComponent(
  importFunc: () => Promise<{ default: ComponentType }>,
  fallbackComponent?: ReactNode,
): ReactNode {
  const LazyComponent = lazy(importFunc);

  return createElement(Suspense, { fallback: fallbackComponent ?? null }, createElement(LazyComponent));
}
