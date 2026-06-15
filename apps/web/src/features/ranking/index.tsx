import { RankingPanel } from '@/features/ranking/panel';
import type { RankingPage } from '@/features/ranking/types';

const RANKING_PAGE_SIZE = 10;

export { RANKING_PAGE_SIZE };

export function HotArticle({ errorMessage = '', initialPage }: { errorMessage?: string; initialPage: RankingPage }) {
  return <RankingPanel errorMessage={errorMessage} initialPage={initialPage} pageSize={RANKING_PAGE_SIZE} type="hot" />;
}

export function HotTopic({ errorMessage = '', initialPage }: { errorMessage?: string; initialPage: RankingPage }) {
  return (
    <RankingPanel errorMessage={errorMessage} initialPage={initialPage} pageSize={RANKING_PAGE_SIZE} type="viral" />
  );
}
