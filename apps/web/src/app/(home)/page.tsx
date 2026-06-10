import { ArticleContent, ContentHeroBanner } from '@/features/content';
import { HotArticle, HotTopic } from '@/features/ranking';

export default function HomePage() {
  return (
    <div className="min-w-0 space-y-4">
      <section className="grid min-w-0 gap-4 xl:grid-cols-[300px_minmax(0,1fr)_300px]" aria-label="内容分发概览">
        <HotArticle />
        <ContentHeroBanner />
        <HotTopic />
      </section>

      <ArticleContent />
    </div>
  );
}
