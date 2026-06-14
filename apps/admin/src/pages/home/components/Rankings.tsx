import { useEffect, useState, type ReactNode } from 'react';
import { Button, Card, Empty, Flex, Skeleton, Space, Tag, Typography, message } from 'antd';
import { ArrowRightOutlined, FireOutlined, ReloadOutlined, TrophyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getRankingApi, type RankingItemResponse, type RankingTypeValue } from '@/api/ranking';

const { Paragraph, Text } = Typography;

const rankingMeta: Record<
  RankingTypeValue,
  {
    title: string;
    extra: string;
    icon: ReactNode;
    accentClassName: string;
  }
> = {
  hot: {
    title: '热点榜',
    extra: '综合热度 Top 5',
    icon: <FireOutlined />,
    accentClassName: 'bg-rose-50 text-rose-600',
  },
  viral: {
    title: '爆文榜',
    extra: '传播潜力 Top 5',
    icon: <TrophyOutlined />,
    accentClassName: 'bg-amber-50 text-amber-600',
  },
};

export function HotRankingList() {
  return <RankingList rankingType="hot" />;
}

export function ViralRankingList() {
  return <RankingList rankingType="viral" />;
}

function RankingList({ rankingType }: { rankingType: RankingTypeValue }) {
  const navigate = useNavigate();
  const meta = rankingMeta[rankingType];
  const [items, setItems] = useState<RankingItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRanking = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await getRankingApi(rankingType, {
        cursor: null,
        limit: 5,
        sort: 'comprehensive',
      });
      setItems(response.data.items);
    } catch {
      message.error(`${meta.title}加载失败，请稍后重试`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadRanking();
  }, [rankingType]);

  return (
    <Card
      variant="borderless"
      className="h-full min-h-92 w-full shadow-sm"
      title={
        <Flex align="center" gap={10}>
          <span className={`flex size-9 items-center justify-center rounded-lg text-lg ${meta.accentClassName}`}>
            {meta.icon}
          </span>
          <span>{meta.title}</span>
        </Flex>
      }
      extra={
        <Space size={4}>
          <Text type="secondary" className="text-xs">
            {meta.extra}
          </Text>
          <Button
            type="text"
            size="small"
            aria-label={`刷新${meta.title}`}
            icon={<ReloadOutlined />}
            loading={refreshing}
            onClick={() => void loadRanking(true)}
          />
        </Space>
      }
    >
      {loading ? (
        <Flex vertical gap={14}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} active avatar paragraph={{ rows: 2 }} />
          ))}
        </Flex>
      ) : items.length === 0 ? (
        <Empty description={`暂无${meta.title}内容`} className="py-8" />
      ) : (
        <Flex vertical gap={12}>
          {items.map((item, index) => (
            <RankingItem key={item.id} item={item} rank={index + 1} rankingType={rankingType} />
          ))}
        </Flex>
      )}

      <Flex justify="center" className="pt-4">
        <Button type="link" onClick={() => navigate('/rankings')}>
          查看更多 <ArrowRightOutlined />
        </Button>
      </Flex>
    </Card>
  );
}

function RankingItem({
  item,
  rank,
  rankingType,
}: {
  item: RankingItemResponse;
  rank: number;
  rankingType: RankingTypeValue;
}) {
  const scoreColor = rankingType === 'hot' ? 'text-rose-600' : 'text-amber-600';

  return (
    <button
      type="button"
      className="flex w-full cursor-pointer gap-3 rounded-lg border border-slate-100 bg-white p-3 text-left transition hover:border-slate-200 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
    >
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          rank <= 3 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {rank}
      </span>
      <span className="min-w-0 flex-1">
        <Flex align="center" justify="space-between" gap={8}>
          <Text strong className="min-w-0 flex-1 truncate">
            {item.title}
          </Text>
          <Text className={`shrink-0 text-sm font-semibold ${scoreColor}`}>{item.rankingScore.toFixed(1)}</Text>
        </Flex>
        <Space size={6} wrap className="mt-1">
          <Tag bordered={false} className="m-0">
            {getContentTypeLabel(item.contentType)}
          </Tag>
          <Text type="secondary" className="text-xs">
            阅读 {item.viewCount.toLocaleString()}
          </Text>
          <Text type="secondary" className="text-xs">
            分享 {item.shareCount.toLocaleString()}
          </Text>
        </Space>
        {item.summary && (
          <Paragraph type="secondary" ellipsis={{ rows: 2 }} className="mt-1! mb-0! text-xs">
            {item.summary}
          </Paragraph>
        )}
      </span>
    </button>
  );
}

function getContentTypeLabel(contentType: string) {
  const labels: Record<string, string> = {
    ARTICLE: '长文',
    IMAGE_TEXT: '短图文',
    SHORT_POST: '短内容',
  };

  return labels[contentType] ?? contentType;
}
