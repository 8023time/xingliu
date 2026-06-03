import { Suspense } from 'react';
import { ExploreFeed } from '@/components/content/explore-feed';

export default function ExplorePage() {
  return (
    <div>
      <Suspense
        fallback={<div className="rounded-3xl bg-white px-6 py-16 text-center text-sm text-zinc-500">正在加载内容</div>}
      >
        <ExploreFeed />
      </Suspense>
    </div>
  );
}
