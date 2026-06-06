import { useCallback, useEffect, useMemo, useState, type Key } from 'react';
import {
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
  Select,
  type TableProps,
  type UploadProps,
} from 'antd';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  FileOutlined,
  LinkOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  createLinkAssetApi,
  deleteAssetApi,
  getAssetsApi,
  moderateAssetApi,
  uploadAssetApi,
  type AssetRecord,
  type AssetType,
  type SafetyStatus,
} from '@/api/asset';
import { ProductHeaderCard } from '@/components/ui';

const { Dragger } = Upload;
const { Text } = Typography;
const PAGE_SIZE = 20;

const typeLabels: Record<AssetType, string> = {
  IMAGE: '图片',
  VIDEO: '视频',
  DOCUMENT: '文档',
  LINK: '链接',
  AUDIO: '音频',
};

const safetyMeta: Record<SafetyStatus, { label: string; color: string }> = {
  PENDING: { label: '待审核', color: 'gold' },
  PASS: { label: '审核通过', color: 'green' },
  REJECT: { label: '审核拒绝', color: 'red' },
};

export default function AssetsPage() {
  const [items, setItems] = useState<AssetRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [deleting, setDeleting] = useState(false);

  const loadAssets = useCallback(async (nextPage = 1, nextPageSize = PAGE_SIZE) => {
    setLoading(true);
    setFailed(false);
    setSelectedRowKeys([]);

    try {
      const response = await getAssetsApi({ page: nextPage, pageSize: nextPageSize });
      setItems(response.data.items);
      setPage(response.data.page);
      setPageSize(response.data.pageSize);
      setTotal(response.data.total);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Route entry must trigger the initial request.
    void loadAssets();
  }, [loadAssets]);

  const handleModerate = async (id: string) => {
    await moderateAssetApi(id);
    message.success('素材审核完成');
    await loadAssets(page, pageSize);
  };

  const handleDelete = async (id: string) => {
    await deleteAssetApi(id);
    message.success('素材已删除');
    await loadAssets(1, pageSize);
  };

  const selectedAssets = useMemo(
    () => items.filter((item) => selectedRowKeys.includes(item.id)),
    [items, selectedRowKeys],
  );

  const handleBatchDelete = async () => {
    if (selectedAssets.length === 0) {
      return;
    }

    setDeleting(true);
    try {
      await Promise.all(selectedAssets.map((item) => deleteAssetApi(item.id)));
      message.success(`已删除 ${selectedAssets.length} 个素材`);
      await loadAssets(1, pageSize);
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableProps<AssetRecord>['columns'] = [
    {
      title: '素材',
      dataIndex: 'name',
      render: (_, record) => (
        <Flex align="center" gap={12}>
          {record.type === 'IMAGE' ? (
            <Image
              src={record.url}
              alt={record.name}
              width={72}
              height={54}
              className="rounded-lg object-cover"
              fallback="/xingliu.png"
            />
          ) : (
            <span className="flex h-[54px] w-[72px] items-center justify-center rounded-lg bg-slate-100 text-xl text-slate-500">
              {record.type === 'LINK' ? <LinkOutlined /> : <FileOutlined />}
            </span>
          )}
          <Flex vertical gap={4} className="min-w-0">
            <Text strong ellipsis={{ tooltip: record.name }}>
              {record.name}
            </Text>
            <Space size={6} wrap>
              <Tag>{typeLabels[record.type]}</Tag>
              <Text type="secondary">{formatSize(record.sizeBytes)}</Text>
            </Space>
          </Flex>
        </Flex>
      ),
    },
    {
      title: '合规状态',
      dataIndex: 'safetyStatus',
      width: 180,
      render: (_, record) => (
        <Flex vertical gap={4}>
          <Tag color={safetyMeta[record.safetyStatus].color}>{safetyMeta[record.safetyStatus].label}</Tag>
          {record.safetyReason && (
            <Text type="secondary" ellipsis={{ tooltip: record.safetyReason }}>
              {record.safetyReason}
            </Text>
          )}
        </Flex>
      ),
    },
    {
      title: '对象路径',
      dataIndex: 'objectPath',
      width: 260,
      render: (value: string | null) => (
        <Text type="secondary" ellipsis={{ tooltip: value ?? '外部链接' }}>
          {value ?? '外部链接'}
        </Text>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space>
          <Tooltip title="重新审核">
            <Button
              aria-label={`重新审核 ${record.name}`}
              icon={<SafetyCertificateOutlined />}
              onClick={() => handleModerate(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="删除素材"
            description="删除后不会出现在素材库中，确定继续吗？"
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button aria-label={`删除 ${record.name}`} danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card className="h-full overflow-hidden">
      <ProductHeaderCard
        title="素材管理"
        className="mb-4"
        description="上传创作素材或保存外部链接。文件由 MinIO 管理，数据库仅保存对象路径；审核失败时素材保持待审核。"
        actions={[
          { label: '添加素材', icon: <CloudUploadOutlined />, onClick: () => setAssetModalOpen(true), type: 'primary' },
          {
            label: '什么是素材？',
            onClick: () => {
              Modal.info({
                title: '什么是素材？',
                content: (
                  <div>
                    <p>素材是创作时可引用的图片、文件或外部链接，统一保存在素材库中。</p>
                    <p>上传文件由 MinIO 保存对象内容，平台数据库只记录对象路径和基础元数据。</p>
                    <p>素材需通过基础合规审核后，才能作为 AI 创作和内容生产的可用参考。</p>
                  </div>
                ),
                okText: '知道了',
              });
            },
            type: 'link',
          },
        ]}
      />

      <Flex align="center" justify="space-between" className="mb-4">
        <Form className="mb-4" layout="inline">
          <Form.Item name="category" label="素材类型" className="mb-0">
            <Select
              style={{ width: 120 }}
              options={[
                { label: '全部', value: '' },
                { label: '私有', value: 'private' },
                { label: '公共', value: 'public' },
              ]}
              placeholder="请选择分类"
            />
          </Form.Item>
        </Form>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => loadAssets(page, pageSize)} loading={loading}>
            刷新
          </Button>
          <Popconfirm
            title="批量删除素材"
            description={`将删除选中的 ${selectedAssets.length} 个素材，确定继续吗？`}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true, loading: deleting }}
            disabled={selectedAssets.length === 0}
            onConfirm={handleBatchDelete}
          >
            <Button danger icon={<DeleteOutlined />} disabled={selectedAssets.length === 0} loading={deleting}>
              批量删除
            </Button>
          </Popconfirm>
        </Space>
      </Flex>

      {failed && items.length === 0 ? (
        <Empty description="素材加载失败，请检查网络后重试" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button type="primary" onClick={() => loadAssets(page, pageSize)}>
            重新加载
          </Button>
        </Empty>
      ) : (
        <div className="mt-4 min-h-0 flex-1 overflow-hidden">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={items}
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
              void loadAssets(pagination.current ?? 1, pagination.pageSize ?? PAGE_SIZE);
            }}
            locale={{ emptyText: <Empty description="还没有素材，先上传一个文件或添加链接" /> }}
            scroll={{
              x: 1000,
              y: 'calc(100vh - 432px)',
            }}
          />
        </div>
      )}

      <AssetCreateModal
        open={assetModalOpen}
        onCancel={() => setAssetModalOpen(false)}
        onSaved={async () => {
          setAssetModalOpen(false);
          await loadAssets(1, pageSize);
        }}
      />
    </Card>
  );
}

function AssetCreateModal({
  open,
  onCancel,
  onSaved,
}: {
  open: boolean;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form] = Form.useForm<{ name: string; url: string }>();
  const [saving, setSaving] = useState(false);
  const uploadProps: UploadProps = {
    multiple: false,
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      if (!(file instanceof File)) {
        onError?.(new Error('无法读取上传文件'));
        return;
      }

      try {
        await uploadAssetApi(file);
        message.success('素材上传成功');
        onSuccess?.({});
        await onSaved();
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('素材上传失败'));
      }
    },
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await createLinkAssetApi(values);
      message.success('链接素材已创建');
      form.resetFields();
      await onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="添加素材" open={open} footer={null} onCancel={onCancel} destroyOnHidden width={720}>
      <Tabs
        items={[
          {
            key: 'upload',
            label: '上传文件',
            children: (
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <CloudUploadOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
                <p className="ant-upload-hint">单个文件最大 20 MB，图片上传后会自动发起基础合规审核</p>
              </Dragger>
            ),
          },
          {
            key: 'link',
            label: '添加链接',
            children: (
              <Form form={form} layout="vertical" className="pt-3">
                <Form.Item name="name" label="素材名称" rules={[{ required: true, message: '请输入素材名称' }]}>
                  <Input maxLength={200} showCount placeholder="例如：品牌官网参考链接" />
                </Form.Item>
                <Form.Item
                  name="url"
                  label="外部链接"
                  rules={[
                    { required: true, message: '请输入外部链接' },
                    { type: 'url', message: '请输入包含 http:// 或 https:// 的完整链接' },
                  ]}
                >
                  <Input prefix={<LinkOutlined />} placeholder="https://example.com/resource" />
                </Form.Item>
                <Flex justify="flex-end">
                  <Button type="primary" loading={saving} onClick={handleSubmit}>
                    添加链接
                  </Button>
                </Flex>
              </Form>
            ),
          },
        ]}
      />
    </Modal>
  );
}

function formatSize(sizeBytes: number | null) {
  if (!sizeBytes) return '外部资源';
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}
