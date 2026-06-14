import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Flex,
  Progress,
  Segmented,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
  Modal,
} from 'antd';
import {
  ClockCircleOutlined,
  EyeOutlined,
  FireOutlined,
  InfoCircleOutlined,
  LikeOutlined,
  ReloadOutlined,
  RiseOutlined,
  StarOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import type { RankingItemResponse, RankingSortValue, RankingTypeValue } from '@xingliu/shared/content/ranking';
import { getRankingApi } from '@/api/ranking';
import { ProductHeaderCard } from '@/components/ui';

const { Paragraph, Text, Title } = Typography;

const sortOptions: Array<{ label: string; value: RankingSortValue }> = [
  { label: '综合排序', value: 'comprehensive' },
  { label: '质量优先', value: 'quality' },
  { label: '热度优先', value: 'heat' },
  { label: '最新发布', value: 'latest' },
];

const rankingMeta: Record<
  RankingTypeValue,
  {
    title: string;
    icon: React.ReactNode;
    accentClassName: string;
  }
> = {
  hot: {
    title: '热点榜',
    icon: <FireOutlined />,
    accentClassName: 'bg-rose-50 text-rose-500',
  },
  viral: {
    title: '爆文榜',
    icon: <TrophyOutlined />,
    accentClassName: 'bg-amber-50 text-amber-500',
  },
};

export default function RankingsPage() {
  return (
    <Card className="h-full overflow-hidden">
      <ProductHeaderCard
        title="内容排行榜"
        className="mb-5"
        description="综合内容质量分、阅读热度和发布时间衰减生成榜单；滚动到底自动加载更多。"
        actions={[
          {
            label: '数据来源',
            icon: <InfoCircleOutlined />,
            type: 'link',
            onClick: () => {
              Modal.info({
                title: '数据来源说明',
                okText: '知道了',
                content: (
                  <div>
                    <Paragraph>排行榜数据基于平台内容质量分、阅读热度和发布时间进行综合排序。</Paragraph>
                    <ul className="mb-3 pl-5">
                      <li>
                        <Text strong>质量分</Text>：由 AI 模型评估内容的原创性、结构完整性、语言表达等维度得出。
                      </li>
                      <li>
                        <Text strong>热度</Text>：综合阅读量、点赞数、分享数等指标，反映内容的受欢迎程度。
                      </li>
                      <li>
                        <Text strong>发布时间衰减</Text>：为了突出新鲜内容，会对发布时间较早的内容进行适度衰减。
                      </li>
                    </ul>
                    <Paragraph className="mb-0!">
                      通过这些维度的综合评估，排行榜可以动态反映正在升温和具备爆款潜力的内容。
                    </Paragraph>
                  </div>
                ),
              });
            },
          },
          {
            label: '热点榜说明',
            icon: <FireOutlined />,
            type: 'link',
            onClick: () => {
              Modal.info({
                title: '热点榜说明',
                okText: '知道了',
                content: (
                  <div>
                    <Paragraph>
                      热点榜基于内容的综合质量、阅读热度和发布时间进行排序，帮助您发现正在升温的内容。
                    </Paragraph>
                  </div>
                ),
              });
            },
          },
          {
            label: '爆文榜说明',
            icon: <TrophyOutlined />,
            type: 'link',
            onClick: () => [
              Modal.info({
                title: '爆文榜说明',
                okText: '知道了',
                content: (
                  <div>
                    <Paragraph>爆文榜突出高质量、高热度和高传播潜力的内容，适合复盘爆款结构和选题。</Paragraph>
                  </div>
                ),
              }),
            ],
          },
        ]}
      />

      <div className="min-h-0 overflow-x-auto pb-2">
        <div className="grid min-w-270 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5">
          <RankingColumn rankingType="hot" />
          <RankingColumn rankingType="viral" />
        </div>
      </div>
    </Card>
  );
}

function RankingColumn({ rankingType }: { rankingType: RankingTypeValue }) {
  const [sort, setSort] = useState<RankingSortValue>('comprehensive');
  const [items, setItems] = useState<RankingItemResponse[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const meta = rankingMeta[rankingType];

  const loadPage = useCallback(
    async (nextCursor: string | null, replace = false, isInitial = false) => {
      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;
      setLoading(true);

      try {
        if (isInitial) {
          setItems([]);
          setCursor(null);
          setHasMore(true);
          setInitialLoading(true);
        }

        const response = await getRankingApi(rankingType, {
          cursor: nextCursor,
          limit: 10,
          sort,
        });
        const page = response.data;

        setItems((currentItems) => (replace ? page.items : [...currentItems, ...page.items]));
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
      } finally {
        loadingRef.current = false;
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [rankingType, sort],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    void loadPage(null, true, true);
  }, [loadPage]);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;

    if (!root || !sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingRef.current && !initialLoading) {
          void loadPage(cursor);
        }
      },
      {
        root,
        rootMargin: '120px',
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, hasMore, initialLoading, loadPage]);

  const handleReload = () => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
    setInitialLoading(true);
    scrollRef.current?.scrollTo({ top: 0 });
    void loadPage(null, true);
  };

  return (
    <Card
      variant="borderless"
      className="min-w-0 rounded-xl shadow-sm"
      title={
        <Flex align="center" gap={10}>
          <span className={`flex size-9 items-center justify-center rounded-lg text-lg ${meta.accentClassName}`}>
            {meta.icon}
          </span>
          <span>{meta.title}</span>
        </Flex>
      }
      extra={
        <Flex align="center" gap={8} wrap="wrap">
          <Segmented options={sortOptions} value={sort} onChange={(value) => setSort(value)} />
          <Button type="text" icon={<ReloadOutlined />} onClick={handleReload}>
            刷新
          </Button>
        </Flex>
      }
    >
      <div ref={scrollRef} className="h-160 overflow-y-auto pr-2">
        {initialLoading ? (
          <Flex vertical gap={14}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} active avatar paragraph={{ rows: 3 }} />
            ))}
          </Flex>
        ) : items.length === 0 ? (
          <Empty description="暂无榜单内容" className="py-20" />
        ) : (
          <Flex vertical gap={14}>
            {items.map((item, index) => (
              <RankingItemCard key={item.id} item={item} index={index} rankingType={rankingType} />
            ))}
          </Flex>
        )}

        <div ref={sentinelRef} className="h-10">
          <Flex align="center" justify="center" className="h-full">
            {loading && !initialLoading ? (
              <Text type="secondary">加载中...</Text>
            ) : (
              !hasMore && items.length > 0 && <Text type="secondary">没有更多了</Text>
            )}
          </Flex>
        </div>
      </div>
    </Card>
  );
}

function RankingItemCard({
  item,
  index,
  rankingType,
}: {
  item: RankingItemResponse;
  index: number;
  rankingType: RankingTypeValue;
}) {
  const rank = index + 1;
  const scoreColor = rankingType === 'hot' ? '#f43f5e' : '#f59e0b';

  return (
    <article className="rounded-lg border border-slate-100 bg-white p-4 transition hover:border-rose-100 hover:bg-slate-50">
      <Flex gap={14} align="flex-start">
        <div className="flex w-9 shrink-0 justify-center pt-1">
          <span
            className={`flex size-7 items-center justify-center rounded-full text-sm font-semibold ${
              rank <= 3 ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {rank}
          </span>
        </div>

        <Flex vertical gap={10} className="min-w-0 flex-1">
          <Flex align="flex-start" justify="space-between" gap={12}>
            <div className="min-w-0 flex-1">
              <Title level={5} className="mt-0! mb-1! truncate">
                {item.title}
              </Title>
              <Space size={8} wrap>
                <Text type="secondary">{item.authorName}</Text>
                <Tag bordered={false}>{getContentTypeLabel(item.contentType)}</Tag>
                <Text type="secondary">
                  <ClockCircleOutlined /> {formatDate(item.publishedAt)}
                </Text>
              </Space>
            </div>
            <Statistic
              className="shrink-0"
              title="综合分"
              value={item.rankingScore}
              precision={1}
              valueStyle={{ color: scoreColor, fontSize: 22 }}
            />
          </Flex>

          {item.summary && (
            <Paragraph type="secondary" ellipsis={{ rows: 2 }} className="mb-0!">
              {item.summary}
            </Paragraph>
          )}

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Factor label="质量" value={item.qualityScore} icon={<StarOutlined />} />
            <Factor label="热度" value={item.heatScore} icon={<EyeOutlined />} />
            <Factor label="新鲜" value={item.freshnessScore} icon={<RiseOutlined />} />
            <Factor label="互动" value={item.interactionScore} icon={<LikeOutlined />} />
          </div>

          <Flex align="center" justify="space-between" gap={12} wrap="wrap">
            <Text type="secondary" className="text-xs">
              {item.reason}
            </Text>
            <Space size={12}>
              <Text type="secondary" className="text-xs">
                阅读 {item.viewCount.toLocaleString()}
              </Text>
              <Text type="secondary" className="text-xs">
                分享 {item.shareCount.toLocaleString()}
              </Text>
            </Space>
          </Flex>
        </Flex>
      </Flex>
    </article>
  );
}

function Factor({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <Flex align="center" justify="space-between" className="mb-2">
        <Text type="secondary" className="text-xs">
          {icon} {label}
        </Text>
        <Text className="text-xs">{value.toFixed(0)}</Text>
      </Flex>
      <Progress percent={Math.round(value)} showInfo={false} size="small" strokeColor="#f43f5e" />
    </div>
  );
}

function getContentTypeLabel(contentType: string) {
  const labels: Record<string, string> = {
    ARTICLE: '长文章',
    IMAGE_TEXT: '图文',
    SHORT_POST: '短笔记',
  };

  return labels[contentType] ?? contentType;
}

function formatDate(value: Date | string | null) {
  if (!value) {
    return '未发布';
  }

  return new Date(value).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}
