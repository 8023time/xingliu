import { ArticleContent, ContentHeroBanner } from '@/features/content';
import { fetchPublicFeedPage } from '@/features/content/api/feed';
import { HotArticle, HotTopic, RANKING_PAGE_SIZE } from '@/features/ranking';
import { fetchRankingPage } from '@/features/ranking/api/ranking';
import type { RankingPage, RankingType } from '@/features/ranking/types';

const HOME_FEED_PAGE_SIZE = 30;

// 优化: 使用 Promise.allSettled 来并行加载内容分发和榜单数据，避免其中一个接口失败导致整个页面无法渲染。同时为每个接口的错误情况提供独立的错误提示，提升用户体验。
// 将首页的内容分发和榜单数据加载逻辑放在服务器端，利用 Next.js 的 Server Components 特性，减少客户端的加载时间和复杂度，提高页面的首屏渲染速度。
export default async function HomePage() {
  const [feedResult, hotResult, viralResult] = await Promise.allSettled([
    fetchPublicFeedPage({ limit: HOME_FEED_PAGE_SIZE }),
    fetchRankingPage('hot', { limit: RANKING_PAGE_SIZE }),
    fetchRankingPage('viral', { limit: RANKING_PAGE_SIZE }),
  ]);

  const feedPage =
    feedResult.status === 'fulfilled' ? feedResult.value : { items: [], nextCursor: null, hasMore: false };
  const feedError = feedResult.status === 'rejected' ? '内容加载失败，请稍后重试' : '';
  const hotPage = hotResult.status === 'fulfilled' ? hotResult.value : createEmptyRankingPage('hot');
  const hotError = hotResult.status === 'rejected' ? '榜单加载失败，请稍后重试' : '';
  const viralPage = viralResult.status === 'fulfilled' ? viralResult.value : createEmptyRankingPage('viral');
  const viralError = viralResult.status === 'rejected' ? '榜单加载失败，请稍后重试' : '';

  return (
    <div className="min-w-0 space-y-4">
      <section className="grid min-w-0 gap-4 xl:grid-cols-[300px_minmax(0,1fr)_300px]" aria-label="内容分发概览">
        <HotArticle errorMessage={hotError} initialPage={hotPage} />
        <ContentHeroBanner />
        <HotTopic errorMessage={viralError} initialPage={viralPage} />
      </section>

      <ArticleContent
        errorMessage={feedError}
        initialHasMore={!!feedPage.hasMore}
        initialItems={feedPage.items}
        initialNextCursor={feedPage.nextCursor ?? null}
        pageSize={HOME_FEED_PAGE_SIZE}
      />
    </div>
  );
}

function createEmptyRankingPage(rankingType: RankingType): RankingPage {
  return {
    items: [],
    nextCursor: null,
    hasMore: false,
    rankingType,
    sort: 'comprehensive',
    weights: {
      quality: 0,
      heat: 0,
      freshness: 0,
      interaction: 0,
    },
  };
}
