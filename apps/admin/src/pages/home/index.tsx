import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Input,
  Progress,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
  type TableProps,
} from 'antd';
import {
  AuditOutlined,
  CheckCircleOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getContentsApi, type ContentRecord, type ContentStatus, type ContentType } from '@/api/content';
import CreateModal from '@/components/createModal';
import { useAuthStore } from '@/stores/user-store';
import { HotRankingList, ViralRankingList } from './components/Rankings';

const { Text, Title } = Typography;

const RECENT_PAGE_SIZE = 6;

const statusMeta: Record<ContentStatus, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'default' },
  REVIEWING: { label: '审核中', color: 'processing' },
  NEED_REWRITE: { label: '需改写', color: 'warning' },
  REJECTED: { label: '已拒绝', color: 'error' },
  APPROVED: { label: '可发布', color: 'success' },
  PUBLISHED: { label: '已发布', color: 'green' },
  OFFLINE: { label: '已下线', color: 'default' },
};

const typeLabels: Record<ContentType, string> = {
  ARTICLE: '长文',
  IMAGE_TEXT: '短图文',
  SHORT_POST: '短内容',
};

const quickCreateItems: Array<{
  key: ContentType;
  title: string;
  description: string;
  icon: ReactNode;
  iconClassName: string;
  path: string;
}> = [
  {
    key: 'ARTICLE',
    title: '长文创作',
    description: '深度文章、观点稿、知识内容',
    icon: <FileTextOutlined />,
    iconClassName: 'bg-cyan-50 text-cyan-600',
    path: '/content/create?type=article',
  },
  {
    key: 'IMAGE_TEXT',
    title: '短图文',
    description: '社媒图文、种草笔记、封面文案',
    icon: <FileSearchOutlined />,
    iconClassName: 'bg-rose-50 text-rose-600',
    path: '/content/create?type=image-text',
  },
  {
    key: 'SHORT_POST',
    title: '短内容',
    description: '短笔记、灵感记录、轻量发布',
    icon: <EditOutlined />,
    iconClassName: 'bg-amber-50 text-amber-600',
    path: '/content/create?type=note',
  },
];

interface HomeState {
  recentContents: ContentRecord[];
  draftCount: number;
  reviewingCount: number;
  rewriteCount: number;
  approvedCount: number;
  publishedCount: number;
}

const initialHomeState: HomeState = {
  recentContents: [],
  draftCount: 0,
  reviewingCount: 0,
  rewriteCount: 0,
  approvedCount: 0,
  publishedCount: 0,
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [homeState, setHomeState] = useState<HomeState>(initialHomeState);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHome = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [recent, draft, reviewing, rewrite, approved, published] = await Promise.all([
        getContentsApi({ page: 1, pageSize: RECENT_PAGE_SIZE }),
        getContentsApi({ page: 1, pageSize: 1, status: 'DRAFT' }),
        getContentsApi({ page: 1, pageSize: 1, status: 'REVIEWING' }),
        getContentsApi({ page: 1, pageSize: 1, status: 'NEED_REWRITE' }),
        getContentsApi({ page: 1, pageSize: 1, status: 'APPROVED' }),
        getContentsApi({ page: 1, pageSize: 1, status: 'PUBLISHED' }),
      ]);

      setHomeState({
        recentContents: recent.data.items,
        draftCount: draft.data.total,
        reviewingCount: reviewing.data.total,
        rewriteCount: rewrite.data.total,
        approvedCount: approved.data.total,
        publishedCount: published.data.total,
      });
    } catch {
      message.error('首页数据加载失败，请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadHome();
  }, []);

  const averageQualityScore = useMemo(() => {
    const scores = homeState.recentContents
      .map((content) => Number(content.qualityScore))
      .filter((score) => Number.isFinite(score));

    if (scores.length === 0) {
      return null;
    }

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }, [homeState.recentContents]);

  const pendingCount = homeState.reviewingCount + homeState.rewriteCount;

  const columns: TableProps<ContentRecord>['columns'] = [
    {
      title: '内容',
      dataIndex: 'title',
      render: (_, record) => (
        <Flex vertical gap={4}>
          <Button
            type="link"
            className="h-auto p-0! text-left"
            onClick={() => navigate(`/content/create?id=${record.id}`)}
          >
            <Text strong>{record.title || '未命名内容'}</Text>
          </Button>
          <Space size={8} wrap>
            <Tag icon={<FileTextOutlined />}>{typeLabels[record.contentType]}</Tag>
            <Text type="secondary">更新于 {formatDateTime(record.updatedAt)}</Text>
          </Space>
        </Flex>
      ),
    },
    {
      title: '编辑版本',
      dataIndex: 'status',
      width: 110,
      render: (status: ContentStatus) => <Tag color={statusMeta[status].color}>{statusMeta[status].label}</Tag>,
    },
    {
      title: '线上状态',
      width: 110,
      render: (_, record) => (
        <Tag color={record.publishedVersionId ? 'green' : 'default'}>
          {record.publishedVersionId ? '已发布' : '未发布'}
        </Tag>
      ),
    },
    {
      title: '质量分',
      dataIndex: 'qualityScore',
      width: 150,
      render: (value: string | null) =>
        value ? <Progress percent={Math.round(Number(value))} size="small" /> : <Text type="secondary">待评分</Text>,
    },
  ];

  return (
    <Flex gap={24} wrap="wrap" className="p-6">
      <Flex vertical gap={24} className="min-w-0 flex-1">
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <Flex align="center" justify="space-between" gap={24} wrap="wrap">
            <div className="min-w-70 flex-1">
              <Flex align="center" gap={12} wrap="wrap">
                <Avatar size={40} src={user?.avatarUrl ?? '/avatar.jpg'} />
                <Text>你好，{user?.username ?? '创作者'}</Text>
              </Flex>
              <Title level={1} className="mt-4! mb-5!">
                继续推进创作、审核与发布
              </Title>
              <Input.Search
                size="large"
                prefix={<SearchOutlined />}
                placeholder="输入选题关键词，进入编辑器后可选择 Prompt 生成内容"
                enterButton="开始创作"
                className="max-w-2xl"
                onSearch={() => setCreateModalOpen(true)}
              />
            </div>

            <Card className="w-full bg-slate-50 md:w-72" variant="borderless">
              <Flex align="center" justify="space-between" className="mb-4">
                <Text strong>今日工作队列</Text>
                <Button
                  size="small"
                  type="text"
                  aria-label="刷新首页数据"
                  icon={<ReloadOutlined />}
                  loading={refreshing}
                  onClick={() => void loadHome(true)}
                />
              </Flex>
              {loading ? (
                <Skeleton active paragraph={{ rows: 3 }} title={false} />
              ) : (
                <Space direction="vertical" size={12} className="w-full">
                  <QueueTag icon={<EditOutlined />} color="default" count={homeState.draftCount} label="草稿待完善" />
                  <QueueTag icon={<AuditOutlined />} color="gold" count={pendingCount} label="审核与改写待处理" />
                  <QueueTag icon={<SendOutlined />} color="green" count={homeState.approvedCount} label="可发布内容" />
                </Space>
              )}
            </Card>
          </Flex>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="创作快捷入口">
          {quickCreateItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className="flex min-h-24 cursor-pointer items-center gap-3 rounded-lg border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/30 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
              onClick={() => navigate(item.path)}
            >
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-lg text-xl ${item.iconClassName}`}
              >
                {item.icon}
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <Text strong>{item.title}</Text>
                <Text type="secondary">{item.description}</Text>
              </span>
            </button>
          ))}
        </section>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}>
            <MetricCard
              title="草稿"
              value={homeState.draftCount}
              loading={loading}
              icon={<EditOutlined />}
              suffix="篇"
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <MetricCard
              title="待处理"
              value={pendingCount}
              loading={loading}
              icon={<ExclamationCircleOutlined />}
              suffix="篇"
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <MetricCard
              title="已发布"
              value={homeState.publishedCount}
              loading={loading}
              icon={<CheckCircleOutlined />}
              suffix="篇"
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <MetricCard
              title="近期均分"
              value={averageQualityScore ?? 0}
              loading={loading}
              icon={<SafetyCertificateOutlined />}
              suffix={averageQualityScore === null ? '待评分' : '分'}
              precision={averageQualityScore === null ? 0 : 1}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <Card
              variant="borderless"
              className="h-full shadow-sm"
              title="最近内容"
              extra={
                <Space>
                  <Button type="link" onClick={() => navigate('/content/list')}>
                    查看全部
                  </Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                    新建
                  </Button>
                </Space>
              }
            >
              <Table
                rowKey="id"
                columns={columns}
                dataSource={homeState.recentContents}
                loading={loading}
                pagination={false}
                locale={{ emptyText: <Empty description="暂无内容，先创建一篇草稿" /> }}
                scroll={{ x: 760 }}
              />
            </Card>
          </Col>
          <Col xs={24} xl={8}>
            <Card variant="borderless" className="h-full shadow-sm" title="发布准备度">
              {loading ? (
                <Skeleton active paragraph={{ rows: 5 }} />
              ) : (
                <Space direction="vertical" size={18} className="w-full">
                  <ReadinessItem
                    title="审核通过待发布"
                    value={homeState.approvedCount}
                    total={Math.max(homeState.approvedCount + pendingCount, 1)}
                    description="通过审核和质量评分后即可发布到 C 端。"
                  />
                  <ReadinessItem
                    title="需要合规处理"
                    value={homeState.rewriteCount}
                    total={Math.max(pendingCount, 1)}
                    description="先在编辑器查看审核反馈，再采纳改写并重新审核。"
                    danger
                  />
                  <ReadinessItem
                    title="已上线内容"
                    value={homeState.publishedCount}
                    total={Math.max(homeState.publishedCount + homeState.draftCount, 1)}
                    description="线上版本与编辑版本分离，二次编辑不会覆盖已发布内容。"
                  />
                </Space>
              )}
            </Card>
          </Col>
        </Row>
      </Flex>

      <Flex gap={16} wrap="wrap" className="w-full shrink-0 content-start xl:w-96 2xl:w-110">
        <div className="w-full md:w-[calc(50%-8px)] xl:w-full">
          <HotRankingList />
        </div>
        <div className="w-full md:w-[calc(50%-8px)] xl:w-full">
          <ViralRankingList />
        </div>
      </Flex>

      <CreateModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </Flex>
  );
}

function QueueTag({ icon, color, count, label }: { icon: ReactNode; color: string; count: number; label: string }) {
  return (
    <Tag icon={icon} color={color} className="m-0 w-full rounded-md py-1.5">
      {count} 篇{label}
    </Tag>
  );
}

function MetricCard({
  title,
  value,
  suffix,
  icon,
  loading,
  precision,
}: {
  title: string;
  value: number;
  suffix: string;
  icon: ReactNode;
  loading: boolean;
  precision?: number;
}) {
  return (
    <Card variant="borderless" className="h-full shadow-sm">
      {loading ? (
        <Skeleton active paragraph={false} />
      ) : (
        <Statistic title={title} value={value} suffix={suffix} precision={precision} prefix={icon} />
      )}
    </Card>
  );
}

function ReadinessItem({
  title,
  value,
  total,
  description,
  danger,
}: {
  title: string;
  value: number;
  total: number;
  description: string;
  danger?: boolean;
}) {
  const percent = Math.round((value / total) * 100);

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12}>
        <Text strong>{title}</Text>
        <Text>{value} 篇</Text>
      </Flex>
      <Progress percent={percent} showInfo={false} status={danger ? 'exception' : 'active'} />
      <Text type="secondary">{description}</Text>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
