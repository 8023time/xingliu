'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { fetchPublicContent } from '@/features/content/api/detail';
import { updateContentLikeState } from '@/features/content/api/like';
import { getValidAccessToken } from '@/features/user/api/authenticated-fetch';
import { cn } from '@/lib/class-name';
import { formatNumber } from '@/lib/format';
import { useAuthDialogStore } from '@/stores/auth-dialog-store';
import { useAuthStore } from '@/stores/user-store';

export function ContentLikeButton({
  contentId,
  initialLiked = false,
  initialLikeCount,
}: {
  contentId: string;
  initialLiked?: boolean;
  initialLikeCount: number;
}) {
  const { isLogin, token } = useAuthStore();
  const openAuth = useAuthDialogStore((state) => state.openAuth);
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    if (!isLogin || !token?.accessToken) {
      setLiked(false);
      return;
    }

    getValidAccessToken()
      .then((accessToken) => (accessToken ? fetchPublicContent(contentId, accessToken) : null))
      .then((content) => {
        if (!content || ignore) return;
        setLiked(!!content.viewer?.liked);
        setLikeCount(content.metrics.likeCount);
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, [contentId, isLogin, token?.accessToken]);

  const toggleLike = async () => {
    setError('');

    if (!isLogin || !token?.accessToken) {
      openAuth('login');
      return;
    }

    const nextLiked = !liked;
    setLoading(true);
    try {
      const result = await updateContentLikeState({
        contentId,
        liked: nextLiked,
      });
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        openAuth('login');
        return;
      }
      setError('操作失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggleLike}
        disabled={loading}
        aria-pressed={liked}
        aria-label={liked ? '取消点赞' : '点赞'}
        className={cn(
          'w-full rounded-2xl border px-4 py-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-70',
          liked ? 'border-rose-100 bg-rose-50/70' : 'border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50',
        )}
      >
        <div
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-medium [&_svg]:size-3.5',
            liked ? 'text-rose-600' : 'text-zinc-500',
          )}
        >
          <Heart className={cn(liked ? 'fill-current' : '')} />
          点赞
        </div>
        <div className="mt-1.5 text-xl font-bold tracking-tight text-zinc-900">{formatNumber(likeCount)}</div>
      </button>
      {error ? <p className="mt-2 text-xs text-rose-500">{error}</p> : null}
    </div>
  );
}
