import { useMemo, useEffect, useState, type Key } from 'react';
import {
  Button,
  Card,
  Flex,
  Popconfirm,
  Progress,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
  Empty,
  type TableProps,
} from 'antd';
import { DeleteOutlined, EditOutlined, FileTextOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  deleteContentApi,
  getContentsApi,
  type ContentRecord,
  type ContentStatus,
  type ContentType,
} from '@/api/content';
import CreateModal from '@/components/createModal';

const { Text } = Typography;
const PAGE_SIZE = 10;
const ALL_STATUS_TAB_KEY = 'ALL';

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

export default function ContentListPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<ContentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [contentType, setContentType] = useState<ContentType>();
  const [status, setStatus] = useState<ContentStatus>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [deleting, setDeleting] = useState(false);

  const loadContents = async (
    query: {
      page?: number;
      pageSize?: number;
      contentType?: ContentType;
      status?: ContentStatus;
    } = { page, pageSize, contentType, status },
  ) => {
    setLoading(true);
    setSelectedRowKeys([]);
    try {
      const response = await getContentsApi({
        page: query.page ?? page,
        pageSize: query.pageSize ?? pageSize,
        contentType: query.contentType,
        status: query.status,
      });
      setRecords(response.data.items);
      setPage(response.data.page);
      setPageSize(response.data.pageSize);
      setTotal(response.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void getContentsApi({ page: 1, pageSize: PAGE_SIZE })
      .then((response) => {
        if (active) {
          setRecords(response.data.items);
          setPage(response.data.page);
          setPageSize(response.data.pageSize);
          setTotal(response.data.total);
          setSelectedRowKeys([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedContents = useMemo(
    () => records.filter((record) => selectedRowKeys.includes(record.id)),
    [records, selectedRowKeys],
  );

  const handleBatchDelete = async () => {
    if (selectedContents.length === 0) {
      return;
    }

    setDeleting(true);
    try {
      await Promise.all(selectedContents.map((record) => deleteContentApi(record.id)));
      message.success(`已删除 ${selectedContents.length} 条内容`);
      await loadContents({ page: 1, pageSize, contentType, status });
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableProps<ContentRecord>['columns'] = [
    {
      title: '内容',
      dataIndex: 'title',
      render: (_, record) => (
        <Flex vertical gap={4}>
          <Text strong>{record.title || '未命名内容'}</Text>
          <Space size={8}>
            <Tag icon={<FileTextOutlined />}>{typeLabels[record.contentType]}</Tag>
            <Text type="secondary">更新于 {new Date(record.updatedAt).toLocaleString('zh-CN')}</Text>
          </Space>
        </Flex>
      ),
    },
    {
      title: '编辑版本',
      dataIndex: 'status',
      width: 110,
      render: (value: ContentStatus) => <Tag color={statusMeta[value].color}>{statusMeta[value].label}</Tag>,
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
      width: 160,
      render: (value: string | null) =>
        value ? <Progress percent={Number(value)} size="small" /> : <Text type="secondary">待评分</Text>,
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            aria-label="编辑内容"
            icon={<EditOutlined />}
            onClick={() => navigate(`/content/create?id=${record.id}`)}
          />
          <Popconfirm
            title="确认删除该内容？"
            description="内容将被软删除，云端草稿不会继续展示。"
            onConfirm={async () => {
              await deleteContentApi(record.id);
              message.success('内容已删除');
              await loadContents();
            }}
          >
            <Button danger aria-label="删除内容" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card className="h-full overflow-hidden">
      <Flex align="center" justify="space-between" gap={16} wrap="wrap">
        <Tabs
          activeKey={status ?? ALL_STATUS_TAB_KEY}
          items={[
            { key: ALL_STATUS_TAB_KEY, label: '全部' },
            ...Object.entries(statusMeta).map(([value, meta]) => ({ key: value, label: meta.label })),
          ]}
          onChange={(key) => {
            const nextStatus = key === ALL_STATUS_TAB_KEY ? undefined : (key as ContentStatus);
            setStatus(nextStatus);
            void loadContents({ page: 1, pageSize, contentType, status: nextStatus });
          }}
        />

        <Flex gap={12} wrap="wrap" align="center" justify="flex-end">
          <Select
            placeholder="内容类型"
            className="w-36"
            value={contentType}
            options={Object.entries(typeLabels).map(([value, label]) => ({ value, label }))}
            onChange={(value) => {
              setContentType(value);
              void loadContents({ page: 1, pageSize, contentType: value, status });
            }}
            allowClear
          />
          <Popconfirm
            title="批量删除内容"
            description={`将软删除选中的 ${selectedContents.length} 条内容，云端草稿不会继续展示。确定继续吗？`}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true, loading: deleting }}
            disabled={selectedContents.length === 0}
            onConfirm={handleBatchDelete}
          >
            <Button danger icon={<DeleteOutlined />} disabled={selectedContents.length === 0} loading={deleting}>
              批量删除
            </Button>
          </Popconfirm>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setCreateModalOpen(true);
            }}
          >
            新建内容
          </Button>
          <CreateModal
            open={createModalOpen}
            onClose={() => {
              setCreateModalOpen(false);
            }}
          />
        </Flex>
      </Flex>
      <div className="min-h-0 flex-1 overflow-hidden">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (value) => `共 ${value} 条`,
          }}
          onChange={(pagination) => {
            void loadContents({
              page: pagination.current ?? 1,
              pageSize: pagination.pageSize ?? PAGE_SIZE,
              contentType,
              status,
            });
          }}
          locale={{ emptyText: <Empty description="还没有可用的内容" /> }}
          scroll={{ x: 900, y: 'calc(100vh - 280px)' }}
        />
      </div>
    </Card>
  );
}
