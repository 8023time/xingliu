'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { recordContentView } from '@/features/content/api/view';
import { getValidAccessToken } from '@/features/user/api/authenticated-fetch';
import { formatNumber } from '@/lib/format';

export function ContentViewMetric({ contentId, initialViewCount }: { contentId: string; initialViewCount: number }) {
  const [viewCount, setViewCount] = useState(initialViewCount);

  useEffect(() => {
    getValidAccessToken()
      .then((accessToken) => recordContentView({ contentId, accessToken: accessToken ?? undefined }))
      .then((result) => setViewCount(result.viewCount))
      .catch(() => undefined);
  }, [contentId]);

  return (
    <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 px-4 py-3.5 transition-colors hover:bg-zinc-50">
      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 [&_svg]:size-3.5">
        <Eye />
        阅读
      </div>
      <div className="mt-1.5 text-xl font-bold tracking-tight text-zinc-900">{formatNumber(viewCount)}</div>
    </div>
  );
}
