import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Empty, Flex, List, Progress, Space, Tabs, Tag, Typography, message } from 'antd';
import {
  CheckCircleOutlined,
  FileTextOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  CreatorEditor,
  type AiSuggestion,
  type CreatorEditorHandle,
  type EditorChangePayload,
  type EditorMaterial,
  type QualitySignal,
} from '@/components/editor';
import { useSiderStore } from '@/stores/sider-store';

const { Paragraph, Text } = Typography;

const suggestions: AiSuggestion[] = [
  {
    id: 'hook',
    title: '开头钩子',
    body: '很多创作者不是没有想法，而是把想法散落在不同工具里。把选题、素材和审核反馈放到同一条创作链路里，效率会明显提升。',
    tags: ['开头', '观点'],
  },
  {
    id: 'outline',
    title: '三段式大纲',
    body: '第一段提出痛点，第二段拆解解决方法，第三段给出可执行清单，并用数据或案例增强可信度。',
    tags: ['大纲', '结构'],
  },
];

const materials: EditorMaterial[] = [
  {
    id: 'case-1',
    name: 'AI 工具使用案例',
    type: 'document',
    status: 'ready',
    summary: '收集了 5 个创作者使用 AI 进行选题、改写和审核的案例，可用于正文论证。',
  },
  {
    id: 'cover-1',
    name: '小红书封面关键词',
    type: 'image',
    status: 'ready',
    summary: '包含效率、创作流、自动保存、质量评分等高频关键词。',
  },
];

const qualitySignals: QualitySignal[] = [
  {
    id: 'title',
    label: '标题吸引力',
    score: 86,
    risk: 'safe',
    message: '标题方向明确，可以补充数字或场景增强点击预期。',
  },
  {
    id: 'safe',
    label: '合规安全',
    score: 72,
    risk: 'warning',
    message: '注意避免绝对化表达，发布前建议再做一次审核。',
  },
];

export default function CreateContentPage() {
  const navigate = useNavigate();
  const editorRef = useRef<CreatorEditorHandle>(null);
  const [latestPayload, setLatestPayload] = useState<EditorChangePayload | null>(null);
  const { setCollapsed, setPreviousCollapsed, restoreCollapsed } = useSiderStore();

  const previewHtml = useMemo(() => latestPayload?.html ?? '', [latestPayload]);

  const handleAutoSave = async (payload: EditorChangePayload) => {
    setLatestPayload(payload);
    await Promise.resolve();
  };

  useEffect(() => {
    setPreviousCollapsed(useSiderStore.getState().collapsed);
    setCollapsed(true);

    return () => {
      restoreCollapsed();
    };
  }, [restoreCollapsed, setCollapsed, setPreviousCollapsed]);

  const handlePublish = () => {
    const payload = editorRef.current?.getPayload();

    if (!payload?.text.trim()) {
      message.warning('正文为空，无法发布');
      return;
    }

    message.success('内容已进入站内发布流程');
  };

  return (
    <main className="h-[calc(100vh-79px)] overflow-hidden bg-[#f8f8f8]">
      <div className="grid h-full min-h-0 grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="h-full min-h-0 overflow-hidden">
          <Flex vertical gap={16} className="h-full min-h-0">
            <Card variant="borderless" className="shrink-0 rounded-xl shadow-sm">
              <Flex vertical gap={14}>
                <Paragraph type="secondary" className="!mb-0">
                  素材、审核、AI 建议由页面负责，编辑器只暴露写入和读取接口。
                </Paragraph>
                <Flex gap={10} wrap="wrap">
                  <Button className="rounded-full" onClick={() => navigate('/content/list')}>
                    暂存离开
                  </Button>
                  <Button type="primary" danger className="rounded-full" onClick={handlePublish}>
                    一键排版
                  </Button>
                </Flex>
              </Flex>
            </Card>

            <Card
              variant="borderless"
              className="min-h-0 flex-1 overflow-hidden rounded-xl shadow-sm [&_.ant-card-body]:h-full [&_.ant-card-body]:overflow-hidden"
            >
              <Tabs
                className="h-full overflow-hidden"
                defaultActiveKey="assistant"
                items={[
                  {
                    key: 'assistant',
                    label: 'AI 建议',
                    children: (
                      <SuggestionList
                        suggestions={suggestions}
                        onInsertSuggestion={(suggestion) => editorRef.current?.insertSuggestion(suggestion)}
                      />
                    ),
                  },
                  {
                    key: 'materials',
                    label: '素材',
                    children: (
                      <MaterialList
                        materials={materials}
                        onInsertMaterial={(material) => editorRef.current?.insertMaterial(material)}
                      />
                    ),
                  },
                  {
                    key: 'review',
                    label: '审核',
                    children: <ReviewPanel qualitySignals={qualitySignals} />,
                  },
                  {
                    key: 'preview',
                    label: '预览',
                    children: <PreviewPanel html={previewHtml} />,
                  },
                ]}
              />
            </Card>
          </Flex>
        </aside>

        <section className="h-full overflow-hidden rounded-xl bg-[#f8f8f8]">
          <CreatorEditor
            ref={editorRef}
            editorOptions={{
              draftId: 'content-create-draft',
              projectTitle: '',
            }}
            editorCallbacks={{
              onBack: () => navigate(-1),
              onChange: setLatestPayload,
              onAutoSave: handleAutoSave,
            }}
          />
        </section>
      </div>
    </main>
  );
}

function SuggestionList({
  suggestions,
  onInsertSuggestion,
}: {
  suggestions: AiSuggestion[];
  onInsertSuggestion: (suggestion: AiSuggestion) => void;
}) {
  return (
    <List
      dataSource={suggestions}
      renderItem={(suggestion) => (
        <List.Item
          actions={[
            <Button key="insert" type="link" icon={<PlusOutlined />} onClick={() => onInsertSuggestion(suggestion)}>
              写入正文
            </Button>,
          ]}
        >
          <List.Item.Meta
            avatar={<ThunderboltOutlined className="mt-1 text-rose-500" />}
            title={suggestion.title}
            description={
              <Space direction="vertical" size={8}>
                <Paragraph ellipsis={{ rows: 3 }} className="!mb-0">
                  {suggestion.body}
                </Paragraph>
                <Space size={[4, 4]} wrap>
                  {suggestion.tags?.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );
}

function MaterialList({
  materials,
  onInsertMaterial,
}: {
  materials: EditorMaterial[];
  onInsertMaterial: (material: EditorMaterial) => void;
}) {
  return (
    <List
      dataSource={materials}
      renderItem={(material) => (
        <List.Item
          actions={[
            <Button key="insert" type="link" icon={<PlusOutlined />} onClick={() => onInsertMaterial(material)}>
              插入素材
            </Button>,
          ]}
        >
          <List.Item.Meta
            avatar={<FileTextOutlined className="mt-1 text-cyan-500" />}
            title={
              <Space size={6} wrap>
                <span>{material.name}</span>
                <Tag>{getMaterialTypeText(material.type)}</Tag>
              </Space>
            }
            description={<Paragraph className="!mb-0">{material.summary || '素材等待解析'}</Paragraph>}
          />
        </List.Item>
      )}
    />
  );
}

function ReviewPanel({ qualitySignals }: { qualitySignals: QualitySignal[] }) {
  return (
    <List
      dataSource={qualitySignals}
      renderItem={(signal) => (
        <List.Item>
          <List.Item.Meta
            avatar={
              signal.risk === 'safe' ? (
                <CheckCircleOutlined className="mt-1 text-emerald-500" />
              ) : (
                <SafetyCertificateOutlined className="mt-1 text-amber-500" />
              )
            }
            title={
              <Space size={8}>
                <span>{signal.label}</span>
                <Tag color={getRiskColor(signal.risk)}>{getRiskText(signal.risk)}</Tag>
              </Space>
            }
            description={
              <Space direction="vertical" size={6} className="w-full">
                <Progress
                  percent={signal.score}
                  size="small"
                  status={signal.risk === 'blocked' ? 'exception' : 'normal'}
                />
                <Text type="secondary">{signal.message}</Text>
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );
}

function PreviewPanel({ html }: { html: string }) {
  if (!html) {
    return <Empty description="开始编辑后可预览正文" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
}

function getMaterialTypeText(type: EditorMaterial['type']) {
  const typeText: Record<EditorMaterial['type'], string> = {
    image: '图片',
    document: '文档',
    audio: '音频',
    video: '视频',
    link: '链接',
    archive: '压缩包',
  };

  return typeText[type];
}

function getRiskText(risk: QualitySignal['risk']) {
  const riskText: Record<QualitySignal['risk'], string> = {
    safe: '通过',
    warning: '需修改',
    blocked: '需拦截',
  };

  return riskText[risk];
}

function getRiskColor(risk: QualitySignal['risk']) {
  const riskColor: Record<QualitySignal['risk'], string> = {
    safe: 'success',
    warning: 'warning',
    blocked: 'error',
  };

  return riskColor[risk];
}
