import { type ReactNode } from 'react';
import { Avatar, Card, Flex, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowRightOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface HotTopic {
  key: string;
  title: string;
  dateRange: string;
  coverClassName: string;
  coverTitle: string;
}

interface CreatorRank {
  key: string;
  name: string;
  followers: string;
  direction: string;
  tag?: string;
}

const baseHotTopics: HotTopic[] = [
  {
    key: 'world-cup',
    title: '世界杯聊个球',
    dateRange: '05-29 至 07-31',
    coverClassName: 'bg-red-500 text-white',
    coverTitle: '聊个球',
  },
  {
    key: 'graduation',
    title: '我的毕业片尾曲',
    dateRange: '06-02 至 07-15',
    coverClassName: 'bg-orange-100 text-orange-600',
    coverTitle: '毕业季',
  },
  {
    key: 'summer',
    title: '21天入夏练功局',
    dateRange: '06-01 至 07-07',
    coverClassName: 'bg-emerald-100 text-emerald-700',
    coverTitle: '练功局',
  },
  {
    key: 'goose',
    title: '鹅鸭杀S3激励活动',
    dateRange: '06-01 至 06-30',
    coverClassName: 'bg-violet-100 text-violet-700',
    coverTitle: 'S3',
  },
  {
    key: 'redbook',
    title: '我在小红书逛核聚变',
    dateRange: '06-01 至 07-01',
    coverClassName: 'bg-rose-100 text-rose-600',
    coverTitle: '核聚变',
  },
  {
    key: 'creator-help',
    title: '明日方舟创作应援',
    dateRange: '06-01 至 07-09',
    coverClassName: 'bg-slate-200 text-slate-700',
    coverTitle: '应援',
  },
];

const baseCreatorRanks: CreatorRank[] = [
  { key: 'yanhu', name: '闽湖阿嬷', followers: '5万', direction: '美食', tag: '近期涨粉迅速' },
  { key: 'zoey', name: '佐伊Zoey', followers: '4.8万', direction: '旅游', tag: '辛勤创作' },
  { key: 'child', name: '儿童眼科余继锋', followers: '4.5万', direction: '医疗健康', tag: '近期有爆款笔记' },
  { key: 'sweet', name: '甜嬉', followers: '4.9万', direction: '旅游' },
  { key: 'bao', name: '愤怒的小猪包', followers: '4.7万', direction: '美食' },
  { key: 'que', name: '李缺缺_', followers: '4.4万', direction: '生活方式' },
];

const hotTopics: HotTopic[] = Array.from({ length: 3 }).flatMap((_, pageIndex) =>
  baseHotTopics.map((topic) => ({
    ...topic,
    key: `${topic.key}-${pageIndex + 1}`,
  })),
);

const creatorRanks: CreatorRank[] = Array.from({ length: 3 }).flatMap((_, pageIndex) =>
  baseCreatorRanks.map((creator) => ({
    ...creator,
    key: `${creator.key}-${pageIndex + 1}`,
  })),
);

function RankingCard({ title, extra, children }: { title: string; extra: string; children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <Card
      variant="borderless"
      className={`h-165 w-full rounded-3xl shadow-sm [&_.ant-card-body]:flex [&_.ant-card-body]:h-[calc(100%-40px)] [&_.ant-card-body]:flex-col`}
      title={<span className="text-base font-semibold text-slate-950">{title}</span>}
      extra={<span className="text-xs text-slate-400">{extra}</span>}
    >
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      <div className="flex justify-center pt-1">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
          onClick={() => navigate('/rankings')}
        >
          <span>查看更多</span>
          <ArrowRightOutlined />
        </button>
      </div>
    </Card>
  );
}

export const HotTopicsList = () => {
  const topTopics = hotTopics.slice(0, 10);

  return (
    <RankingCard title="热点追踪" extra="热点 top 10 🔥">
      <div className="h-full pr-1">
        <Flex vertical gap={10}>
          {topTopics.map((topic, index) => (
            <button
              key={topic.key}
              className={`flex w-full cursor-pointer items-center gap-4 rounded-lg p-2 text-left transition hover:bg-slate-50 ${
                index === 0 ? 'bg-slate-50' : 'bg-white'
              }`}
            >
              <span
                className={`flex size-16 shrink-0 items-center justify-center rounded-md px-2 text-center text-sm leading-4 font-bold ${topic.coverClassName}`}
              >
                {topic.coverTitle}
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <Text strong className="truncate text-sm">
                  {topic.title}
                </Text>
                <Text type="secondary" className="text-xs">
                  {topic.dateRange}
                </Text>
              </span>
            </button>
          ))}
        </Flex>
      </div>
    </RankingCard>
  );
};

export const PopularArticlesList = () => {
  const topCreators = creatorRanks.slice(0, 10);

  return (
    <RankingCard title="爆文榜单" extra="爆文 top 10 🔥">
      <div className="h-full">
        <Flex vertical gap={12}>
          {topCreators.map((creator, index) => (
            <button key={creator.key} className="flex w-full cursor-pointer items-center gap-4 text-left">
              <Avatar size={48} src={index % 2 === 0 ? '/avatar.jpg' : '/xingliu.png'} />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex min-w-0 items-center gap-2">
                  <Text strong className="truncate text-sm">
                    {creator.name}
                  </Text>
                  {creator.tag && (
                    <Tag bordered={false} className="m-0 shrink-0 rounded bg-slate-50 px-2 text-xs text-slate-400">
                      {creator.tag}
                    </Tag>
                  )}
                </span>
                <Text type="secondary" className="text-xs">
                  粉丝数：{creator.followers}
                </Text>
                <Text type="secondary" className="text-xs">
                  创作方向：{creator.direction}
                </Text>
              </span>
            </button>
          ))}
        </Flex>
      </div>
    </RankingCard>
  );
};
