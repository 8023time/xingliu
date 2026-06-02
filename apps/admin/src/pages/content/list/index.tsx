import type { TableProps } from 'antd';
import { Button, Card, Flex, Input, Progress, Select, Space, Table, Tabs, Tag, Tooltip, Typography } from 'antd';
import {
  AuditOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  PlusOutlined,
  SearchOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

interface ContentRecord {
  key: string;
  title: string;
  channel: string;
  status: '草稿' | '审核中' | '需改写' | '可发布' | '已发布';
  quality: number;
  risk: '低' | '中' | '高';
  reads: number;
  updatedAt: string;
}

const contentRecords: ContentRecord[] = [
  {
    key: 'content-1',
    title: '618 家居清洁好物种草笔记',
    channel: '小红书笔记',
    status: '草稿',
    quality: 82,
    risk: '低',
    reads: 0,
    updatedAt: '2026-06-01 20:12',
  },
  {
    key: 'content-2',
    title: 'AI 创作工具选型指南',
    channel: '公众号文章',
    status: '审核中',
    quality: 88,
    risk: '低',
    reads: 0,
    updatedAt: '2026-06-01 19:40',
  },
  {
    key: 'content-3',
    title: '三步搭建个人知识库脚本',
    channel: '短视频脚本',
    status: '需改写',
    quality: 71,
    risk: '中',
    reads: 0,
    updatedAt: '2026-05-31 22:10',
  },
  {
    key: 'content-4',
    title: '高质量内容分发复盘',
    channel: '公众号文章',
    status: '已发布',
    quality: 93,
    risk: '低',
    reads: 12840,
    updatedAt: '2026-05-31 17:32',
  },
  {
    key: 'content-5',
    title: '创作者如何用 AI 做选题池',
    channel: '公众号文章',
    status: '可发布',
    quality: 89,
    risk: '低',
    reads: 0,
    updatedAt: '2026-05-30 16:08',
  },
];

const statusColor: Record<ContentRecord['status'], string> = {
  草稿: 'default',
  审核中: 'processing',
  需改写: 'warning',
  可发布: 'success',
  已发布: 'green',
};

const riskColor: Record<ContentRecord['risk'], string> = {
  低: 'success',
  中: 'warning',
  高: 'error',
};

export default function ContentListPage() {
  const navigate = useNavigate();

  const columns: TableProps<ContentRecord>['columns'] = [
    {
      title: '内容',
      dataIndex: 'title',
      render: (_, record) => (
        <Flex vertical gap={4} className="content-title-cell">
          <Text strong>{record.title}</Text>
          <Space size={8}>
            <Tag icon={<FileTextOutlined />}>{record.channel}</Tag>
            <Text type="secondary">更新于 {record.updatedAt}</Text>
          </Space>
        </Flex>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (status: ContentRecord['status']) => <Tag color={statusColor[status]}>{status}</Tag>,
    },
    {
      title: '风险',
      dataIndex: 'risk',
      width: 90,
      render: (risk: ContentRecord['risk']) => <Tag color={riskColor[risk]}>{risk}风险</Tag>,
    },
    {
      title: '质量分',
      dataIndex: 'quality',
      width: 160,
      render: (quality: number) => <Progress percent={quality} size="small" strokeColor="#00c4cc" />,
    },
    {
      title: '阅读',
      dataIndex: 'reads',
      width: 110,
      render: (reads: number) => reads.toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 170,
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑内容">
            <Button aria-label="编辑内容" icon={<EditOutlined />} onClick={() => navigate('/content/create')} />
          </Tooltip>
          <Tooltip title="查看审核">
            <Button aria-label="查看审核" icon={<AuditOutlined />} />
          </Tooltip>
          <Tooltip title={record.status === '已发布' ? '查看数据' : '发布内容'}>
            <Button aria-label={record.status === '已发布' ? '查看数据' : '发布内容'} icon={record.status === '已发布' ? <EyeOutlined /> : <SendOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <main className="content-list-page">
      <section className="content-toolbar">
        <Tabs
          defaultActiveKey="all"
          items={[
            { key: 'all', label: '全部内容' },
            { key: 'draft', label: '草稿' },
            { key: 'review', label: '审核中' },
            { key: 'rewrite', label: '需改写' },
            { key: 'published', label: '已发布' },
          ]}
        />
        <Flex gap={12} wrap="wrap" align="center">
          <Input prefix={<SearchOutlined />} placeholder="搜索标题、标签或内容 ID" className="content-search" allowClear />
          <Select
            placeholder="内容类型"
            className="content-select"
            options={[
              { value: 'article', label: '公众号文章' },
              { value: 'note', label: '小红书笔记' },
              { value: 'script', label: '短视频脚本' },
            ]}
            allowClear
          />
          <Button icon={<FilterOutlined />}>筛选</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/content/create')}>
            新建内容
          </Button>
        </Flex>
      </section>

      <Card variant="borderless" className="panel-card">
        <Table columns={columns} dataSource={contentRecords} pagination={{ pageSize: 8 }} scroll={{ x: 900 }} />
      </Card>
    </main>
  );
}
