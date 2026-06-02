import {
  Avatar,
  Button,
  Card,
  Col,
  Flex,
  Input,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  type TableProps,
} from 'antd';
import {
  AuditOutlined,
  CloudSyncOutlined,
  EditOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SendOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/user-store';
import { HotTopicsList, PopularArticlesList } from './components/Rankings';

const { Text, Title } = Typography;

interface WorkbenchShortcut {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconClassName: string;
}

interface RecentProject {
  key: string;
  title: string;
  type: string;
  status: '草稿' | '审核中' | '需改写' | '已发布';
  quality: number;
  updatedAt: string;
}

const shortcuts: WorkbenchShortcut[] = [
  {
    key: 'article',
    title: '公众号文章',
    description: '长图文、深度内容、观点稿',
    icon: <FileTextOutlined />,
    iconClassName: 'bg-cyan-50 text-cyan-500',
  },
  {
    key: 'note',
    title: '小红书笔记',
    description: '种草标题、封面建议、标签',
    icon: <StarOutlined />,
    iconClassName: 'bg-rose-50 text-rose-500',
  },
  {
    key: 'script',
    title: '短视频脚本',
    description: '分镜脚本、口播、节奏优化',
    icon: <RocketOutlined />,
    iconClassName: 'bg-violet-50 text-violet-500',
  },
  {
    key: 'audit',
    title: '合规改写',
    description: '风险片段识别与一键替换',
    icon: <SafetyCertificateOutlined />,
    iconClassName: 'bg-emerald-50 text-emerald-500',
  },
];

const recentProjects: RecentProject[] = [
  {
    key: '1',
    title: '618 家居清洁好物种草笔记',
    type: '小红书笔记',
    status: '草稿',
    quality: 82,
    updatedAt: '10 分钟前',
  },
  { key: '2', title: 'AI 创作工具选型指南', type: '公众号文章', status: '审核中', quality: 88, updatedAt: '42 分钟前' },
  {
    key: '3',
    title: '三步搭建个人知识库脚本',
    type: '短视频脚本',
    status: '需改写',
    quality: 71,
    updatedAt: '昨天 22:10',
  },
  { key: '4', title: '高质量内容分发复盘', type: '公众号文章', status: '已发布', quality: 93, updatedAt: '昨天 17:32' },
];

const statusColor: Record<RecentProject['status'], string> = {
  草稿: 'default',
  审核中: 'processing',
  需改写: 'warning',
  已发布: 'success',
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const columns: TableProps<RecentProject>['columns'] = [
    {
      title: '内容项目',
      dataIndex: 'title',
      render: (_, record) => (
        <Flex vertical gap={2}>
          <Text strong>{record.title}</Text>
          <Text type="secondary">{record.type}</Text>
        </Flex>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (status: RecentProject['status']) => <Tag color={statusColor[status]}>{status}</Tag>,
    },
    {
      title: '质量分',
      dataIndex: 'quality',
      width: 150,
      render: (quality: number) => <Progress percent={quality} size="small" strokeColor="#00c4cc" />,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 130,
    },
  ];

  return (
    <Flex gap={24} wrap="wrap" className="p-6">
      <Flex vertical gap={24} className="min-w-0 flex-1">
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <Flex align="center" justify="space-between" gap={24} wrap="wrap">
            <div className="min-w-[280px] flex-1">
              <Flex align="center" gap={12}>
                <Avatar size={40} src={user?.avatarUrl ?? '/avatar.jpg'} />
                <Text>晚上好，{user?.username ?? '创作者'}</Text>
              </Flex>
              <Title level={1} className="!mb-6 !mt-4">
                今天要创作什么？
              </Title>
              <Input.Search
                size="large"
                prefix={<SearchOutlined />}
                placeholder="例如：写一篇 AI 工具效率提升的小红书笔记"
                enterButton="开始创作"
                className="max-w-2xl"
                onSearch={() => navigate('/content/create')}
              />
            </div>
            <div className="w-full rounded-lg bg-slate-50 p-4 md:w-[220px]">
              <Text strong>今日生产链路</Text>
              <Space direction="vertical" size={12} className="mt-4 w-full">
                <Tag icon={<EditOutlined />} color="cyan">
                  6 篇草稿待完善
                </Tag>
                <Tag icon={<AuditOutlined />} color="gold">
                  2 篇需要审核处理
                </Tag>
                <Tag icon={<SendOutlined />} color="green">
                  3 篇可发布内容
                </Tag>
              </Space>
            </div>
          </Flex>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="创作快捷入口">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.key}
              className="flex min-h-24 cursor-pointer items-center gap-3 rounded-lg border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:border-cyan-200 hover:shadow-md"
              onClick={() => navigate('/content/create')}
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-xl ${shortcut.iconClassName}`}
              >
                {shortcut.icon}
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <Text strong>{shortcut.title}</Text>
                <Text type="secondary">{shortcut.description}</Text>
              </span>
            </button>
          ))}
        </section>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}>
            <Card variant="borderless" className="h-full shadow-sm">
              <Statistic title="本周生成内容" value={28} suffix="篇" prefix={<FileTextOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card variant="borderless" className="h-full shadow-sm">
              <Statistic title="平均质量分" value={86.4} suffix="分" precision={1} prefix={<FileSearchOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card variant="borderless" className="h-full shadow-sm">
              <Statistic title="审核通过率" value={91} suffix="%" prefix={<SafetyCertificateOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card variant="borderless" className="h-full shadow-sm">
              <Statistic title="云端同步队列" value={4} suffix="项" prefix={<CloudSyncOutlined />} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <Card
              variant="borderless"
              className="h-full shadow-sm"
              title="最近内容项目"
              extra={
                <Button type="link" onClick={() => navigate('/content/list')}>
                  查看全部
                </Button>
              }
            >
              <Table columns={columns} dataSource={recentProjects} pagination={false} />
            </Card>
          </Col>
          <Col xs={24} xl={8}>
            <Card variant="borderless" className="h-full shadow-sm" title="质量与风险建议">
              <Space direction="vertical" size={16} className="w-full">
                <QualityItem title="标题吸引力" value={88} description="近期标题点击预估稳定，可继续使用数字化表达。" />
                <QualityItem title="合规安全" value={76} description="3 篇内容出现绝对化表述，发布前建议改写。" />
                <QualityItem
                  title="分发匹配"
                  value={82}
                  description="公众号长文表现更好，小红书笔记建议补充封面关键词。"
                />
              </Space>
            </Card>
          </Col>
        </Row>
      </Flex>
      <Flex gap={16} wrap="wrap" className="w-full shrink-0 content-start xl:w-[360px] 2xl:w-[420px]">
        <div className="w-full md:w-[calc(50%-8px)] xl:w-full">
          <HotTopicsList />
        </div>
        <div className="w-full md:w-[calc(50%-8px)] xl:w-full">
          <PopularArticlesList />
        </div>
      </Flex>
    </Flex>
  );
}



function QualityItem({ title, value, description }: { title: string; value: number; description: string }) {
  return (
    <div>
      <Flex justify="space-between" align="center">
        <Text strong>{title}</Text>
        <Text>{value} 分</Text>
      </Flex>
      <Progress percent={value} showInfo={false} strokeColor="#00c4cc" />
      <Text type="secondary">{description}</Text>
    </div>
  );
}
