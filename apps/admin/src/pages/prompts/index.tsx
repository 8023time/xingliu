import { useCallback, useEffect, useMemo, useState, type Key } from 'react';
import {
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  type TableProps,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/user-store';
import {
  createPromptApi,
  deletePromptApi,
  getPromptsApi,
  updatePromptApi,
  type PromptInput,
  type PromptRecord,
  type PromptVisibility,
} from '@/api/prompt';
import { ProductHeaderCard } from '@/components/ui';

const { Paragraph, Text } = Typography;
const PAGE_SIZE = 20;

const visibilityMeta: Record<PromptVisibility, { label: string; color: string }> = {
  PRIVATE: { label: '我的私有', color: 'blue' },
  PUBLIC: { label: '公共只读', color: 'green' },
  SYSTEM: { label: '系统只读', color: 'purple' },
};

export default function PromptsPage() {
  const userId = useAuthStore((state) => state.user?.id);
  const [items, setItems] = useState<PromptRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<PromptRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [deleting, setDeleting] = useState(false);

  const isEditablePrompt = useCallback(
    (record: PromptRecord) => record.ownerId === userId && record.visibility === 'PRIVATE',
    [userId],
  );

  const loadPrompts = useCallback(async (nextPage = 1, nextPageSize = PAGE_SIZE) => {
    setLoading(true);
    setSelectedRowKeys([]);

    try {
      const response = await getPromptsApi({ page: nextPage, pageSize: nextPageSize });
      setItems(response.data.items);
      setPage(response.data.page);
      setPageSize(response.data.pageSize);
      setTotal(response.data.total);
    } catch {
      // Handle error silently or show a notification
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Route entry must trigger the initial request.
    void loadPrompts();
  }, [loadPrompts]);

  const handleDelete = async (id: string) => {
    await deletePromptApi(id);
    message.success('Prompt 已删除');
    await loadPrompts(1, pageSize);
  };

  const selectedEditablePrompts = useMemo(
    () => items.filter((item) => selectedRowKeys.includes(item.id) && isEditablePrompt(item)),
    [isEditablePrompt, items, selectedRowKeys],
  );

  const handleBatchDelete = async () => {
    if (selectedEditablePrompts.length === 0) {
      return;
    }

    setDeleting(true);
    try {
      await Promise.all(selectedEditablePrompts.map((item) => deletePromptApi(item.id)));
      message.success(`已删除 ${selectedEditablePrompts.length} 个 Prompt`);
      await loadPrompts(1, pageSize);
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableProps<PromptRecord>['columns'] = [
    {
      title: 'Prompt',
      dataIndex: 'name',
      render: (_, record) => (
        <Flex vertical gap={4}>
          <Flex align="center" gap={8} wrap="wrap">
            <Text strong>{record.name}</Text>
            <Tag color={visibilityMeta[record.visibility].color}>{visibilityMeta[record.visibility].label}</Tag>
          </Flex>
          <Paragraph type="secondary" ellipsis={{ rows: 2 }} className="mb-0! max-w-2xl">
            {record.description || '暂无说明'}
          </Paragraph>
        </Flex>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 150,
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      width: 110,
    },
    {
      title: '最近更新',
      dataIndex: 'updatedAt',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => {
        const editable = isEditablePrompt(record);

        if (!editable) {
          return <Text type="secondary">只读</Text>;
        }

        return (
          <Space>
            <Button
              aria-label={`编辑 ${record.name}`}
              icon={<EditOutlined />}
              onClick={() => {
                setEditingPrompt(record);
                setModalOpen(true);
              }}
            />
            <Popconfirm
              title="删除 Prompt"
              description="删除后不会出现在列表中，确定继续吗？"
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record.id)}
            >
              <Button aria-label={`删除 ${record.name}`} danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Card className="h-full overflow-hidden">
      <ProductHeaderCard
        title="Prompt 管理"
        className="mb-4"
        description="管理您的 Prompt，包括创建、编辑和删除操作"
        actions={[
          { label: '新建 Prompt', icon: <PlusOutlined />, onClick: () => setModalOpen(true), type: 'primary' },
          {
            label: '什么是 Prompt？',
            onClick: () => {
              Modal.info({
                title: '什么是 Prompt？',
                content: (
                  <div>
                    <p>Prompt 是预设的输入提示模板，帮助您快速生成符合预期的内容。</p>
                    <p>您可以创建私有 Prompt 供自己使用，也可以使用公共只读 Prompt 作为参考。</p>
                    <p>在编辑 Prompt 时，可以使用明确的变量占位说明，以便在实际使用时替换为具体内容。</p>
                  </div>
                ),
                okText: '知道了',
              });
            },
            type: 'link',
          },
        ]}
      />
      <Flex align="center" justify="space-between">
        <Form className="mb-4" layout="inline">
          <Form.Item name="category" label="Prompt 类型" className="mb-0">
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
          <Form.Item name="category" label="Prompt 分类" className="mb-0">
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
          <Button icon={<ReloadOutlined />} onClick={() => loadPrompts(page, pageSize)} loading={loading}>
            刷新
          </Button>
          <Popconfirm
            title="批量删除 Prompt"
            description={`将删除选中的 ${selectedEditablePrompts.length} 个私有 Prompt，确定继续吗？`}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true, loading: deleting }}
            disabled={selectedEditablePrompts.length === 0}
            onConfirm={handleBatchDelete}
          >
            <Button danger icon={<DeleteOutlined />} disabled={selectedEditablePrompts.length === 0} loading={deleting}>
              批量删除
            </Button>
          </Popconfirm>
        </Space>
      </Flex>

      <div className="mt-4 min-h-0 flex-1 overflow-hidden">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: !isEditablePrompt(record),
              name: record.name,
            }),
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (value) => `共 ${value} 条`,
          }}
          onChange={(pagination) => {
            void loadPrompts(pagination.current ?? 1, pagination.pageSize ?? PAGE_SIZE);
          }}
          locale={{ emptyText: <Empty description="还没有可用的 Prompt" /> }}
          scroll={{
            x: 900,
            y: 'calc(100vh - 430px)',
          }}
        />
      </div>

      <PromptFormModal
        open={modalOpen}
        prompt={editingPrompt}
        onCancel={() => setModalOpen(false)}
        onSaved={async () => {
          setModalOpen(false);
          await loadPrompts(1, pageSize);
        }}
      />
    </Card>
  );
}

function PromptFormModal({
  open,
  prompt,
  onCancel,
  onSaved,
}: {
  open: boolean;
  prompt: PromptRecord | null;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form] = Form.useForm<PromptInput>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue({
      name: prompt?.name ?? '',
      category: prompt?.category ?? '',
      description: prompt?.description ?? '',
      template: prompt?.template ?? '',
    });
  }, [form, open, prompt]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSaving(true);

    try {
      if (prompt) {
        await updatePromptApi(prompt.id, values);
        message.success('Prompt 已更新');
      } else {
        await createPromptApi(values);
        message.success('Prompt 已创建');
      }
      await onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={prompt ? '编辑 Prompt' : '新建 Prompt'}
      open={open}
      okText={prompt ? '保存修改' : '创建 Prompt'}
      cancelText="取消"
      confirmLoading={saving}
      onOk={handleSubmit}
      onCancel={onCancel}
      destroyOnHidden
      width={720}
    >
      <Form form={form} layout="vertical" requiredMark="optional" className="pt-3">
        <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入 Prompt 名称' }]}>
          <Input maxLength={100} showCount placeholder="例如：深度文章结构生成" />
        </Form.Item>
        <Form.Item name="category" label="分类" rules={[{ required: true, message: '请输入分类' }]}>
          <Input maxLength={50} placeholder="例如：长文、短图文、标题" />
        </Form.Item>
        <Form.Item name="description" label="说明">
          <Input.TextArea maxLength={500} showCount rows={2} placeholder="说明适用场景和预期输出" />
        </Form.Item>
        <Form.Item name="template" label="Prompt 模板" rules={[{ required: true, message: '请输入 Prompt 模板' }]}>
          <Input.TextArea
            maxLength={20000}
            showCount
            rows={10}
            placeholder="输入提示词模板，可使用明确的变量占位说明"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
