import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Empty, Flex, Input, List, Select, Space, Spin, Tag, Typography, message } from 'antd';
import { CloudSyncOutlined, PlusOutlined, ThunderboltOutlined, WarningOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  acceptComplianceRewriteApi,
  createComplianceRewriteApi,
  createContentApi,
  deleteContentApi,
  evaluateContentQualityApi,
  getContentApi,
  getLatestDraftApi,
  offlineContentApi,
  publishContentApi,
  reviewContentApi,
  saveDraftApi,
  syncDraftApi,
  type ContentRecord,
  type ContentType,
  type DraftRecord,
  type QualityEvaluationRecord,
  type RewriteRecord,
  type SafetyReviewRecord,
} from '@/api/content';
import { generateCandidatesApi, type AiCandidate } from '@/api/ai';
import { getPromptsApi, type PromptRecord } from '@/api/prompt';
import { getAssetsApi, type AssetRecord } from '@/api/asset';
import { CreatorEditor, type CreatorEditorHandle, type EditorChangePayload } from '@/components/editor';
import type { JSONContent } from '@/components/editor/Tiptap/type/editor-types';
import { localDrafts, type LocalDraft } from '@/lib/local-drafts';

const { Paragraph, Text } = Typography;
const EMPTY_DOCUMENT: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] };

export default function CreateContentPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editorRef = useRef<CreatorEditorHandle>(null);
  const initializedRef = useRef(false);
  const latestPayloadRef = useRef<EditorChangePayload | null>(null);
  const clientRevisionRef = useRef(0);
  const serverRevisionRef = useRef(0);
  const cloudDraftIdRef = useRef<string | null>(null);
  const localDirtyRef = useRef(false);
  const summaryRef = useRef('');
  const titleSaveTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const summarySaveTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const [content, setContent] = useState<ContentRecord | null>(null);
  const [initialTitle, setInitialTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [initialContent, setInitialContent] = useState<JSONContent>(EMPTY_DOCUMENT);
  const [editorKey, setEditorKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cloudSaving, setCloudSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [qualityEvaluating, setQualityEvaluating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [acceptingRewrite, setAcceptingRewrite] = useState(false);
  const [reviewResult, setReviewResult] = useState<SafetyReviewRecord | null>(null);
  const [qualityResult, setQualityResult] = useState<QualityEvaluationRecord | null>(null);
  const [rewriteCandidate, setRewriteCandidate] = useState<RewriteRecord | null>(null);
  const [rewriteInstruction, setRewriteInstruction] = useState('');
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'saved' | 'pending' | 'error'>('idle');
  const [conflict, setConflict] = useState<DraftRecord | null>(null);
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [topic, setTopic] = useState('');
  const [promptId, setPromptId] = useState<string>();
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [audience, setAudience] = useState('');
  const [style, setStyle] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<AiCandidate[]>([]);
  const [generating, setGenerating] = useState(false);

  const applyDraft = useCallback((draft: DraftRecord | LocalDraft | null) => {
    if (!draft) return;
    setInitialTitle(draft.title);
    summaryRef.current = draft.summary ?? '';
    setSummary(summaryRef.current);
    setInitialContent((draft.bodyJson as JSONContent | null) ?? EMPTY_DOCUMENT);
    clientRevisionRef.current = draft.clientRevision;
    serverRevisionRef.current = draft.serverRevision;
    cloudDraftIdRef.current = 'id' in draft ? draft.id : null;
    latestPayloadRef.current = {
      draftId: draft.contentId,
      projectTitle: draft.title,
      json: (draft.bodyJson as JSONContent | null) ?? EMPTY_DOCUMENT,
      html: draft.body,
      text: '',
      updatedAt: 'updatedAt' in draft && typeof draft.updatedAt === 'number' ? draft.updatedAt : Date.now(),
    };
    setEditorKey((value) => value + 1);
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initialize = async () => {
      try {
        let contentId = searchParams.get('id');
        let currentContent: ContentRecord;
        if (contentId) {
          currentContent = (await getContentApi(contentId)).data;
        } else {
          currentContent = (await createContentApi({ contentType: parseContentType(searchParams.get('type')) })).data;
          contentId = currentContent.id;
          setSearchParams({ id: contentId }, { replace: true });
        }

        setContent(currentContent);
        summaryRef.current = currentContent.summary ?? '';
        setSummary(summaryRef.current);
        const [cloudResponse, local] = await Promise.all([getLatestDraftApi(contentId), localDrafts.get(contentId)]);
        const cloud = cloudResponse.data;

        if (local && cloud && local.serverRevision < cloud.serverRevision) {
          setConflict(cloud);
          applyDraft(local);
        } else if (local && (!cloud || local.updatedAt > new Date(cloud.createdAt).getTime())) {
          applyDraft(local);
          localDirtyRef.current = local.serverRevision === (cloud?.serverRevision ?? 0);
          setCloudStatus(localDirtyRef.current ? 'pending' : 'saved');
        } else {
          applyDraft(cloud);
          if (cloud) setCloudStatus('saved');
        }
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, [applyDraft, searchParams, setSearchParams]);

  useEffect(() => {
    return () => {
      if (titleSaveTimerRef.current) window.clearTimeout(titleSaveTimerRef.current);
      if (summarySaveTimerRef.current) window.clearTimeout(summarySaveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    void Promise.all([getPromptsApi({ page: 1, pageSize: 50 }), getAssetsApi({ page: 1, pageSize: 50 })]).then(
      ([promptResponse, assetResponse]) => {
        setPrompts(promptResponse.data.items);
        setAssets(assetResponse.data.items.filter((asset) => asset.safetyStatus === 'PASS'));
      },
    );
  }, []);

  const persistLocal = useCallback(
    async (payload: EditorChangePayload) => {
      if (!content) return;
      const clientRevision = clientRevisionRef.current + 1;
      clientRevisionRef.current = clientRevision;
      latestPayloadRef.current = payload;
      localDirtyRef.current = true;
      setCloudStatus('pending');
      await localDrafts.put({
        contentId: content.id,
        title: payload.projectTitle,
        summary: summaryRef.current,
        body: payload.html,
        bodyJson: payload.json as Record<string, unknown>,
        clientRevision,
        serverRevision: serverRevisionRef.current,
        baseVersionId: content.currentVersionId,
        updatedAt: payload.updatedAt,
      });
    },
    [content],
  );

  const saveCloud = useCallback(
    async (offlineSync = false) => {
      const payload = latestPayloadRef.current;
      if (!content || !payload || !localDirtyRef.current || conflict || !navigator.onLine) return null;

      setCloudSaving(true);
      try {
        const draftInput = {
          title: payload.projectTitle,
          summary: summaryRef.current,
          body: payload.html,
          bodyJson: payload.json as Record<string, unknown>,
          baseVersionId: content.currentVersionId ?? undefined,
          clientRevision: clientRevisionRef.current,
          serverRevision: serverRevisionRef.current,
          savedFrom: offlineSync ? ('OFFLINE_SYNC' as const) : ('AUTO' as const),
        };
        const response = offlineSync
          ? await syncDraftApi(content.id, draftInput)
          : await saveDraftApi(content.id, draftInput);
        serverRevisionRef.current = response.data.serverRevision;
        cloudDraftIdRef.current = response.data.id;
        localDirtyRef.current = false;
        setCloudStatus('saved');
        await localDrafts.put({
          contentId: content.id,
          title: payload.projectTitle,
          summary: summaryRef.current,
          body: payload.html,
          bodyJson: payload.json as Record<string, unknown>,
          clientRevision: clientRevisionRef.current,
          serverRevision: response.data.serverRevision,
          baseVersionId: content.currentVersionId,
          updatedAt: payload.updatedAt,
        });
        message.success('云端草稿已保存');
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          const cloudDraft = error.response.data?.conflict?.cloudDraft as DraftRecord | null;
          setConflict(cloudDraft);
        }
        setCloudStatus('error');
        throw error;
      } finally {
        setCloudSaving(false);
      }
    },
    [conflict, content],
  );

  const keepLocalDraft = async () => {
    const payload = latestPayloadRef.current ?? editorRef.current?.getPayload();
    if (!content || !conflict || !payload) return;

    setCloudSaving(true);
    try {
      const latestContent = (await getContentApi(content.id)).data;
      const clientRevision = Math.max(clientRevisionRef.current, conflict.clientRevision) + 1;
      const response = await saveDraftApi(content.id, {
        title: payload.projectTitle,
        summary: summaryRef.current,
        body: payload.html,
        bodyJson: payload.json as Record<string, unknown>,
        baseVersionId: latestContent.currentVersionId ?? undefined,
        clientRevision,
        serverRevision: conflict.serverRevision,
        savedFrom: 'MANUAL',
      });
      setContent(latestContent);
      clientRevisionRef.current = clientRevision;
      serverRevisionRef.current = response.data.serverRevision;
      cloudDraftIdRef.current = response.data.id;
      localDirtyRef.current = false;
      setConflict(null);
      setCloudStatus('saved');
      await localDrafts.put({
        contentId: content.id,
        title: payload.projectTitle,
        summary: summaryRef.current,
        body: payload.html,
        bodyJson: payload.json as Record<string, unknown>,
        clientRevision,
        serverRevision: response.data.serverRevision,
        baseVersionId: latestContent.currentVersionId,
        updatedAt: Date.now(),
      });
      message.success('已保留本地草稿并创建新的云端快照');
    } finally {
      setCloudSaving(false);
    }
  };

  const copyAsNewDraft = async () => {
    const payload = latestPayloadRef.current ?? editorRef.current?.getPayload();
    if (!content || !payload) return;

    setCloudSaving(true);
    let newContentId: string | null = null;
    try {
      const newContent = (
        await createContentApi({
          contentType: content.contentType,
          title: payload.projectTitle,
        })
      ).data;
      newContentId = newContent.id;
      await saveDraftApi(newContent.id, {
        title: payload.projectTitle,
        summary: summaryRef.current,
        body: payload.html,
        bodyJson: payload.json as Record<string, unknown>,
        clientRevision: 1,
        serverRevision: 0,
        savedFrom: 'MANUAL',
      });
      await localDrafts.put({
        contentId: newContent.id,
        title: payload.projectTitle,
        summary: summaryRef.current,
        body: payload.html,
        bodyJson: payload.json as Record<string, unknown>,
        clientRevision: 1,
        serverRevision: 1,
        baseVersionId: null,
        updatedAt: Date.now(),
      });
      message.success('已复制为新的内容草稿');
      window.location.assign(`/content/create?id=${newContent.id}`);
    } catch (error) {
      if (newContentId) await deleteContentApi(newContentId).catch(() => undefined);
      throw error;
    } finally {
      setCloudSaving(false);
    }
  };

  const generateCandidates = async () => {
    if (!content || !promptId || !topic.trim()) {
      message.warning('请先填写主题并选择 Prompt');
      return;
    }

    setGenerating(true);
    try {
      const response = await generateCandidatesApi({
        contentId: content.id,
        topic: topic.trim(),
        promptId,
        assetIds: selectedAssetIds,
        audience: audience.trim() || undefined,
        style: style.trim() || undefined,
        keywords,
      });
      setCandidates(response.data.candidates);
      message.success('已生成 3 个经过预检的候选');
    } finally {
      setGenerating(false);
    }
  };

  const submitForReview = async () => {
    const payload = editorRef.current?.getPayload();
    if (!content || !payload) return;
    if (!navigator.onLine) {
      message.warning('离线状态下无法提交审核');
      return;
    }
    if (conflict) {
      message.warning('请先处理云端草稿冲突');
      return;
    }

    setReviewing(true);
    try {
      await persistLocal({ ...payload, updatedAt: Date.now() });
      const savedDraft = await saveCloud();
      const draftSnapshotId = savedDraft?.id ?? cloudDraftIdRef.current;
      if (!draftSnapshotId) {
        message.warning('请先保存云端草稿');
        return;
      }
      const response = await reviewContentApi(content.id, { draftSnapshotId });
      setReviewResult(response.data.safetyReview);
      setQualityResult(response.data.qualityEvaluation);
      setContent((await getContentApi(content.id)).data);
      message.success('内容审核完成');
    } catch (error) {
      setContent((await getContentApi(content.id)).data);
      throw error;
    } finally {
      setReviewing(false);
    }
  };

  const retryQualityEvaluation = async () => {
    if (!content) return;
    setQualityEvaluating(true);
    try {
      const response = await evaluateContentQualityApi(content.id);
      setQualityResult(response.data);
      setContent((await getContentApi(content.id)).data);
      message.success('质量评分完成');
    } finally {
      setQualityEvaluating(false);
    }
  };

  const createComplianceRewrite = async () => {
    if (!content) return;
    setRewriting(true);
    try {
      const response = await createComplianceRewriteApi(content.id, {
        instruction: rewriteInstruction.trim() || undefined,
      });
      setRewriteCandidate(response.data);
      message.success('已生成合规改写候选');
    } finally {
      setRewriting(false);
    }
  };

  const acceptComplianceRewrite = async () => {
    if (!content || !rewriteCandidate) return;
    setAcceptingRewrite(true);
    try {
      const response = await acceptComplianceRewriteApi(content.id, rewriteCandidate.id);
      setRewriteCandidate(response.data.rewriteRecord);
      setReviewResult(response.data.safetyReview);
      setQualityResult(response.data.qualityEvaluation);
      setContent((await getContentApi(content.id)).data);
      message.success('已采纳改写并完成重审');
    } finally {
      setAcceptingRewrite(false);
    }
  };

  const publishContent = async () => {
    if (!content) return;
    setPublishing(true);
    try {
      await publishContentApi(content.id);
      setContent((await getContentApi(content.id)).data);
      message.success('内容已发布');
    } finally {
      setPublishing(false);
    }
  };

  const offlineContent = async () => {
    if (!content) return;
    setPublishing(true);
    try {
      setContent((await offlineContentApi(content.id)).data);
      message.success('内容已下线');
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      void saveCloud().catch(() => undefined);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [saveCloud]);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      if (localDirtyRef.current) setCloudStatus('pending');
    };
    const handleOnline = () => {
      setIsOnline(true);
      void saveCloud(true).catch(() => undefined);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [saveCloud]);

  if (loading || !content) {
    return <Spin fullscreen tip="正在准备内容草稿" />;
  }

  return (
    <main className="h-[calc(100vh-79px)] overflow-hidden bg-[#f8f8f8]">
      <div className="grid h-full min-h-0 grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="h-full min-h-0 overflow-auto">
          <Flex vertical gap={16}>
            <Card variant="borderless" className="rounded-xl shadow-sm">
              <Flex vertical gap={12}>
                <Space wrap>
                  <Tag>{getTypeLabel(content.contentType)}</Tag>
                  <Tag>{content.publishedVersionId ? '线上：已发布' : '线上：未发布'}</Tag>
                  <Tag color={getContentStatusColor(content.status)}>
                    编辑版本：{getContentStatusLabel(content.status)}
                  </Tag>
                  <Tag color={getCloudStatusColor(isOnline, cloudStatus, Boolean(conflict))}>
                    {getCloudStatusLabel(isOnline, cloudStatus, Boolean(conflict))}
                  </Tag>
                </Space>
                <Button
                  icon={<CloudSyncOutlined />}
                  loading={cloudSaving}
                  disabled={Boolean(conflict)}
                  onClick={() => void saveCloud(!isOnline).catch(() => undefined)}
                >
                  立即保存云端草稿
                </Button>
                <Button onClick={() => navigate('/content/list')}>暂存离开</Button>
                <Button
                  type="primary"
                  loading={reviewing}
                  disabled={Boolean(conflict) || !isOnline}
                  onClick={() => void submitForReview().catch(() => undefined)}
                >
                  提交审核
                </Button>
                {content.safetyStatus === 'PASS' && !content.qualityScore && (
                  <Button
                    loading={qualityEvaluating}
                    onClick={() => void retryQualityEvaluation().catch(() => undefined)}
                  >
                    重试质量评分
                  </Button>
                )}
                {content.status === 'APPROVED' && (
                  <Button
                    type="primary"
                    loading={publishing}
                    onClick={() => void publishContent().catch(() => undefined)}
                  >
                    发布内容
                  </Button>
                )}
                {content.publishedVersionId && (
                  <Button danger loading={publishing} onClick={() => void offlineContent().catch(() => undefined)}>
                    下线内容
                  </Button>
                )}
              </Flex>
            </Card>

            {reviewResult && (
              <Alert
                type={
                  reviewResult.decision === 'PASS'
                    ? 'success'
                    : reviewResult.decision === 'NEED_REWRITE'
                      ? 'warning'
                      : 'error'
                }
                showIcon
                message={`审核结果：${getReviewDecisionLabel(reviewResult.decision)}`}
                description={`风险等级：${reviewResult.riskLevel}；安全分：${reviewResult.safetyScore}${reviewResult.reason ? `；${reviewResult.reason}` : ''}`}
              />
            )}

            {qualityResult && (
              <Alert
                type="success"
                showIcon
                message={`质量评分：${qualityResult.totalScore} / ${qualityResult.level}`}
                description={qualityResult.summary ?? '质量评分已完成'}
              />
            )}

            {content.status === 'NEED_REWRITE' && (
              <Card title="合规改写" variant="borderless" className="rounded-xl shadow-sm">
                <Flex vertical gap={12}>
                  <Input.TextArea
                    value={rewriteInstruction}
                    onChange={(event) => setRewriteInstruction(event.target.value)}
                    placeholder="补充改写要求（可选）"
                    maxLength={500}
                    autoSize={{ minRows: 2, maxRows: 3 }}
                  />
                  <Button
                    loading={rewriting}
                    disabled={!isOnline}
                    onClick={() => void createComplianceRewrite().catch(() => undefined)}
                  >
                    生成合规改写
                  </Button>
                  {rewriteCandidate && (
                    <Flex vertical gap={8}>
                      <Text strong>{rewriteCandidate.rewrittenTitle}</Text>
                      <Paragraph ellipsis={{ rows: 6 }} className="mb-0! whitespace-pre-wrap">
                        {rewriteCandidate.rewrittenBody}
                      </Paragraph>
                      {rewriteCandidate.reason && <Text type="secondary">{rewriteCandidate.reason}</Text>}
                      <Button
                        type="primary"
                        loading={acceptingRewrite}
                        disabled={rewriteCandidate.accepted || !isOnline}
                        onClick={() => void acceptComplianceRewrite().catch(() => undefined)}
                      >
                        采纳并重审
                      </Button>
                    </Flex>
                  )}
                </Flex>
              </Card>
            )}

            {conflict && (
              <Alert
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                message="存在云端草稿冲突"
                description="云端草稿已被其他会话更新。当前本地内容不会静默覆盖云端。"
                action={
                  <Space direction="vertical">
                    <Button size="small" onClick={() => void keepLocalDraft().catch(() => undefined)}>
                      保留本地
                    </Button>
                    <Button
                      size="small"
                      onClick={async () => {
                        applyDraft(conflict);
                        await localDrafts.delete(content.id);
                        setConflict(null);
                        localDirtyRef.current = false;
                        setCloudStatus('saved');
                      }}
                    >
                      保留云端
                    </Button>
                    <Button size="small" type="primary" onClick={() => void copyAsNewDraft().catch(() => undefined)}>
                      复制为新草稿
                    </Button>
                  </Space>
                }
              />
            )}

            <Card title="AI 创作设置" variant="borderless" className="rounded-xl shadow-sm">
              <Flex vertical gap={10}>
                <Input.TextArea
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="输入创作主题"
                  maxLength={1000}
                />
                <Select
                  value={promptId}
                  onChange={setPromptId}
                  placeholder="选择 Prompt"
                  options={prompts.map((prompt) => ({ value: prompt.id, label: prompt.name }))}
                />
                <Select
                  mode="multiple"
                  value={selectedAssetIds}
                  onChange={setSelectedAssetIds}
                  placeholder="选择审核通过的素材"
                  options={assets.map((asset) => ({ value: asset.id, label: asset.name }))}
                />
                <Input
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  placeholder="目标受众（可选）"
                  maxLength={200}
                />
                <Input
                  value={style}
                  onChange={(event) => setStyle(event.target.value)}
                  placeholder="表达风格（可选）"
                  maxLength={200}
                />
                <Select
                  mode="tags"
                  value={keywords}
                  onChange={setKeywords}
                  placeholder="关键词（可选）"
                  maxCount={20}
                />
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  loading={generating}
                  onClick={() => void generateCandidates().catch(() => undefined)}
                >
                  生成 3 个候选
                </Button>
              </Flex>
            </Card>

            <Card title="AI 候选" variant="borderless" className="rounded-xl shadow-sm">
              {candidates.length ? (
                <List
                  dataSource={candidates}
                  renderItem={(candidate) => (
                    <List.Item>
                      <Flex vertical gap={8} className="w-full">
                        <Text strong>{candidate.title}</Text>
                        <Paragraph ellipsis={{ rows: 3 }} className="mb-0!">
                          {candidate.summary}
                        </Paragraph>
                        <Space wrap>
                          {candidate.tags.map((tag) => (
                            <Tag key={tag}>{tag}</Tag>
                          ))}
                        </Space>
                        <Space wrap>
                          <Button
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => editorRef.current?.insertSuggestion(candidate)}
                          >
                            追加正文
                          </Button>
                          <Button
                            size="small"
                            danger
                            onClick={() => editorRef.current?.replaceWithSuggestion(candidate)}
                          >
                            替换正文
                          </Button>
                        </Space>
                      </Flex>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="生成结果会先进入候选区" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Flex>
        </aside>

        <section className="h-full overflow-hidden rounded-xl bg-[#f8f8f8]">
          <Flex vertical className="h-full">
            <Input.TextArea
              aria-label="内容摘要"
              value={summary}
              maxLength={1000}
              autoSize={{ minRows: 2, maxRows: 3 }}
              placeholder="输入内容摘要"
              className="mb-3 shrink-0"
              onChange={(event) => {
                const value = event.target.value;
                summaryRef.current = value;
                setSummary(value);
                if (summarySaveTimerRef.current) window.clearTimeout(summarySaveTimerRef.current);
                summarySaveTimerRef.current = window.setTimeout(() => {
                  const payload = editorRef.current?.getPayload();
                  if (payload) void persistLocal({ ...payload, updatedAt: Date.now() });
                }, 2000);
              }}
            />
            <div className="min-h-0 flex-1 overflow-hidden">
              <CreatorEditor
                key={editorKey}
                ref={editorRef}
                editorOptions={{
                  draftId: content.id,
                  projectTitle: initialTitle,
                  initialContent,
                }}
                editorCallbacks={{
                  onBack: () => navigate('/content/list'),
                  onChange: (payload) => {
                    latestPayloadRef.current = payload;
                  },
                  onAutoSave: persistLocal,
                  onProjectTitleChange: (title) => {
                    if (titleSaveTimerRef.current) window.clearTimeout(titleSaveTimerRef.current);
                    titleSaveTimerRef.current = window.setTimeout(() => {
                      const payload = editorRef.current?.getPayload();
                      if (payload) void persistLocal({ ...payload, projectTitle: title, updatedAt: Date.now() });
                    }, 2000);
                  },
                }}
              />
            </div>
          </Flex>
        </section>
      </div>
    </main>
  );
}

function parseContentType(value: string | null): ContentType {
  if (value === 'image-text') return 'IMAGE_TEXT';
  if (value === 'note' || value === 'short-post') return 'SHORT_POST';
  return 'ARTICLE';
}

function getTypeLabel(value: ContentType) {
  return { ARTICLE: '长文', IMAGE_TEXT: '短图文', SHORT_POST: '短内容' }[value];
}

function getContentStatusLabel(value: ContentRecord['status']) {
  return {
    DRAFT: '草稿',
    REVIEWING: '审核中',
    NEED_REWRITE: '需改写',
    REJECTED: '已拒绝',
    APPROVED: '已通过',
    PUBLISHED: '已发布',
    OFFLINE: '已下线',
  }[value];
}

function getContentStatusColor(value: ContentRecord['status']) {
  if (value === 'APPROVED' || value === 'PUBLISHED') return 'success';
  if (value === 'NEED_REWRITE') return 'warning';
  if (value === 'REJECTED') return 'error';
  if (value === 'REVIEWING') return 'processing';
  return 'default';
}

function getReviewDecisionLabel(value: SafetyReviewRecord['decision']) {
  return { PASS: '通过', NEED_REWRITE: '需改写', REJECT: '拒绝' }[value];
}

function getCloudStatusLabel(isOnline: boolean, status: 'idle' | 'saved' | 'pending' | 'error', conflict: boolean) {
  if (conflict) return '存在冲突';
  if (!isOnline) return '离线编辑中';
  if (status === 'saved') return '云端已保存';
  if (status === 'pending') return '等待云端同步';
  if (status === 'error') return '同步失败';
  return '本地草稿';
}

function getCloudStatusColor(isOnline: boolean, status: 'idle' | 'saved' | 'pending' | 'error', conflict: boolean) {
  if (conflict || status === 'error') return 'error';
  if (!isOnline || status === 'pending') return 'warning';
  if (status === 'saved') return 'success';
  return 'default';
}
