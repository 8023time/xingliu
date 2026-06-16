import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { message, type UploadProps } from 'antd';
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
  updateContentApi,
  type ContentRecord,
  type ContentType,
  type DraftRecord,
  type QualityEvaluationRecord,
  type RewriteRecord,
  type SafetyReviewRecord,
} from '@/api/content';
import { generateContentStreamApi, type AiGenerated } from '@/api/ai';
import { getPromptsApi, type PromptRecord } from '@/api/prompt';
import { getAssetsApi, uploadAssetApi, type AssetRecord } from '@/api/asset';
import type {
  CreatorEditorHandle,
  EditorChangePayload,
  JSONContent,
} from '@/components/editor/Tiptap/type/editor-types';
import { localDrafts, type LocalDraft } from '@/lib/local-drafts';

const EMPTY_DOCUMENT: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] };

export type CloudStatus = 'idle' | 'saved' | 'pending' | 'error';

interface CreateContentState {
  content: ContentRecord | null;
  loading: boolean;
  editorRef: React.RefObject<CreatorEditorHandle | null>;
  editorKey: number;
  initialTitle: string;
  initialContent: JSONContent;
  summary: string;
  cloudSaving: boolean;
  reviewing: boolean;
  qualityEvaluating: boolean;
  publishing: boolean;
  rewriting: boolean;
  acceptingRewrite: boolean;
  reviewResult: SafetyReviewRecord | null;
  qualityResult: QualityEvaluationRecord | null;
  rewriteCandidate: RewriteRecord | null;
  rewriteInstruction: string;
  isOnline: boolean;
  cloudStatus: CloudStatus;
  conflict: DraftRecord | null;
  prompts: PromptRecord[];
  assets: AssetRecord[];
  approvedAssets: AssetRecord[];
  imageAssets: AssetRecord[];
  selectedCover: AssetRecord | null;
  coverSaving: boolean;
  coverUploadProps: UploadProps;
  topic: string;
  promptId: string | undefined;
  selectedAssetIds: string[];
  audience: string;
  style: string;
  keywords: string[];
  generating: boolean;
}

interface CreateContentActions {
  saveCloudNow: () => void;
  leave: () => void;
  submitForReview: () => void;
  retryQualityEvaluation: () => void;
  publishContent: () => void;
  offlineContent: () => void;
  updateCover: (coverAssetId: string | null) => void;
  createComplianceRewrite: () => void;
  acceptComplianceRewrite: () => void;
  keepLocalDraft: () => void;
  useCloudDraft: () => void;
  copyAsNewDraft: () => void;
  setTopic: (value: string) => void;
  setPromptId: (value: string) => void;
  setSelectedAssetIds: (value: string[]) => void;
  setAudience: (value: string) => void;
  setStyle: (value: string) => void;
  setKeywords: (value: string[]) => void;
  setRewriteInstruction: (value: string) => void;
  generateContent: () => void;
  handleSummaryChange: (value: string) => void;
  handleEditorChange: (payload: EditorChangePayload) => void;
  handleEditorAutoSave: (payload: EditorChangePayload) => Promise<void>;
  handleProjectTitleChange: (title: string) => void;
}

export interface CreateContentContextValue extends CreateContentState {
  actions: CreateContentActions;
}

const CreateContentContext = createContext<CreateContentContextValue | null>(null);

export function CreateContentProvider({ children }: { children: ReactNode }) {
  const value = useCreateContentController();
  return <CreateContentContext.Provider value={value}>{children}</CreateContentContext.Provider>;
}

export function useCreateContentContext() {
  const value = useContext(CreateContentContext);
  if (!value) {
    throw new Error('useCreateContentContext must be used within CreateContentProvider');
  }
  return value;
}

function useCreateContentController(): CreateContentContextValue {
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
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('idle');
  const [conflict, setConflict] = useState<DraftRecord | null>(null);
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [coverSaving, setCoverSaving] = useState(false);
  const [topic, setTopic] = useState('');
  const [promptId, setPromptId] = useState<string>();
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [audience, setAudience] = useState('');
  const [style, setStyle] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
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
        setAssets(assetResponse.data.items);
      },
    );
  }, []);

  const approvedAssets = useMemo(() => assets.filter((asset) => asset.safetyStatus === 'PASS'), [assets]);
  const imageAssets = useMemo(() => assets.filter((asset) => asset.type === 'IMAGE'), [assets]);
  const selectedCover = useMemo(
    () => imageAssets.find((asset) => asset.id === content?.coverAssetId) ?? null,
    [content?.coverAssetId, imageAssets],
  );

  const updateCover = useCallback(
    async (coverAssetId: string | null) => {
      if (!content) return;
      setCoverSaving(true);
      try {
        const response = await updateContentApi(content.id, { coverAssetId });
        setContent(response.data);
        message.success(coverAssetId ? '封面已设置' : '已清除封面，将使用默认封面');
      } finally {
        setCoverSaving(false);
      }
    },
    [content],
  );

  const uploadCover: UploadProps['customRequest'] = useCallback(
    async ({ file, onSuccess, onError }) => {
      if (!content) return;
      if (!(file instanceof File) || !file.type.startsWith('image/')) {
        onError?.(new Error('请选择图片文件作为封面'));
        return;
      }

      setCoverSaving(true);
      try {
        const uploaded = (await uploadAssetApi(file, { skipModeration: true })).data;
        const response = await updateContentApi(content.id, { coverAssetId: uploaded.id });
        setAssets((items) => [uploaded, ...items.filter((item) => item.id !== uploaded.id)]);
        setContent(response.data);
        message.success('封面已上传并设置');
        onSuccess?.({});
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('封面上传失败'));
      } finally {
        setCoverSaving(false);
      }
    },
    [content],
  );

  const coverUploadProps = useMemo<UploadProps>(
    () => ({
      accept: 'image/*',
      multiple: false,
      showUploadList: false,
      disabled: coverSaving,
      customRequest: uploadCover,
    }),
    [coverSaving, uploadCover],
  );

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

  const keepLocalDraft = useCallback(async () => {
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
  }, [conflict, content]);

  const copyAsNewDraft = useCallback(async () => {
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
  }, [content]);

  const applyGeneratedContent = useCallback(
    (generated: AiGenerated) => {
      if (!content) return;

      const generatedJson = createGeneratedContentDocument(generated);
      const generatedHtml = createGeneratedContentHtml(generated);
      const now = Date.now();

      setInitialTitle(generated.title);
      summaryRef.current = generated.summary;
      setSummary(generated.summary);
      setInitialContent(generatedJson);
      setEditorKey((value) => value + 1);

      const payload: EditorChangePayload = {
        draftId: content.id,
        projectTitle: generated.title,
        json: generatedJson,
        html: generatedHtml,
        text: [generated.title, generated.summary, generated.body].filter(Boolean).join('\n'),
        updatedAt: now,
      };
      latestPayloadRef.current = payload;
      void persistLocal(payload).catch(() => undefined);
    },
    [content, persistLocal],
  );

  const generateContent = useCallback(async () => {
    if (!content || !promptId || !topic.trim()) {
      message.warning('请先填写主题并选择 Prompt');
      return;
    }

    setGenerating(true);
    editorRef.current?.clear();
    try {
      await generateContentStreamApi(
        {
          contentId: content.id,
          topic: topic.trim(),
          promptId,
          assetIds: selectedAssetIds,
          audience: audience.trim() || undefined,
          style: style.trim() || undefined,
          keywords,
        },
        {
          onBodyDelta: (text) => {
            editorRef.current?.insertContent(createStreamingTextNodes(text));
          },
          onDone: (result) => {
            applyGeneratedContent(result.content);
          },
          onError: (errorMessage) => message.error(errorMessage),
        },
      );
      message.success('已生成内容并写入编辑器');
    } finally {
      setGenerating(false);
    }
  }, [applyGeneratedContent, audience, content, keywords, promptId, selectedAssetIds, style, topic]);

  const submitForReview = useCallback(async () => {
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
  }, [conflict, content, persistLocal, saveCloud]);

  const retryQualityEvaluation = useCallback(async () => {
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
  }, [content]);

  const createComplianceRewrite = useCallback(async () => {
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
  }, [content, rewriteInstruction]);

  const acceptComplianceRewrite = useCallback(async () => {
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
  }, [content, rewriteCandidate]);

  const publishContent = useCallback(async () => {
    if (!content) return;
    setPublishing(true);
    try {
      await publishContentApi(content.id);
      setContent((await getContentApi(content.id)).data);
      message.success('内容已发布');
    } finally {
      setPublishing(false);
    }
  }, [content]);

  const offlineContent = useCallback(async () => {
    if (!content) return;
    setPublishing(true);
    try {
      setContent((await offlineContentApi(content.id)).data);
      message.success('内容已下线');
    } finally {
      setPublishing(false);
    }
  }, [content]);

  const useCloudDraft = useCallback(async () => {
    if (!content || !conflict) return;
    applyDraft(conflict);
    await localDrafts.delete(content.id);
    setConflict(null);
    localDirtyRef.current = false;
    setCloudStatus('saved');
  }, [applyDraft, conflict, content]);

  const handleSummaryChange = useCallback(
    (value: string) => {
      summaryRef.current = value;
      setSummary(value);
      if (summarySaveTimerRef.current) window.clearTimeout(summarySaveTimerRef.current);
      summarySaveTimerRef.current = window.setTimeout(() => {
        const payload = editorRef.current?.getPayload();
        if (payload) void persistLocal({ ...payload, updatedAt: Date.now() });
      }, 2000);
    },
    [persistLocal],
  );

  const handleProjectTitleChange = useCallback(
    (title: string) => {
      if (titleSaveTimerRef.current) window.clearTimeout(titleSaveTimerRef.current);
      titleSaveTimerRef.current = window.setTimeout(() => {
        const payload = editorRef.current?.getPayload();
        if (payload) void persistLocal({ ...payload, projectTitle: title, updatedAt: Date.now() });
      }, 2000);
    },
    [persistLocal],
  );

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

  const actions = useMemo<CreateContentActions>(
    () => ({
      saveCloudNow: () => void saveCloud(!isOnline).catch(() => undefined),
      leave: () => navigate('/content/list'),
      submitForReview: () => void submitForReview().catch(() => undefined),
      retryQualityEvaluation: () => void retryQualityEvaluation().catch(() => undefined),
      publishContent: () => void publishContent().catch(() => undefined),
      offlineContent: () => void offlineContent().catch(() => undefined),
      updateCover: (coverAssetId) => void updateCover(coverAssetId).catch(() => undefined),
      createComplianceRewrite: () => void createComplianceRewrite().catch(() => undefined),
      acceptComplianceRewrite: () => void acceptComplianceRewrite().catch(() => undefined),
      keepLocalDraft: () => void keepLocalDraft().catch(() => undefined),
      useCloudDraft: () => void useCloudDraft().catch(() => undefined),
      copyAsNewDraft: () => void copyAsNewDraft().catch(() => undefined),
      setTopic,
      setPromptId,
      setSelectedAssetIds,
      setAudience,
      setStyle,
      setKeywords,
      setRewriteInstruction,
      generateContent: () => void generateContent().catch(() => undefined),
      handleSummaryChange,
      handleEditorChange: (payload) => {
        latestPayloadRef.current = payload;
      },
      handleEditorAutoSave: persistLocal,
      handleProjectTitleChange,
    }),
    [
      acceptComplianceRewrite,
      copyAsNewDraft,
      createComplianceRewrite,
      generateContent,
      handleProjectTitleChange,
      handleSummaryChange,
      isOnline,
      keepLocalDraft,
      navigate,
      offlineContent,
      persistLocal,
      publishContent,
      retryQualityEvaluation,
      saveCloud,
      submitForReview,
      updateCover,
      useCloudDraft,
    ],
  );

  return {
    content,
    loading,
    editorRef,
    editorKey,
    initialTitle,
    initialContent,
    summary,
    cloudSaving,
    reviewing,
    qualityEvaluating,
    publishing,
    rewriting,
    acceptingRewrite,
    reviewResult,
    qualityResult,
    rewriteCandidate,
    rewriteInstruction,
    isOnline,
    cloudStatus,
    conflict,
    prompts,
    assets,
    approvedAssets,
    imageAssets,
    selectedCover,
    coverSaving,
    coverUploadProps,
    topic,
    promptId,
    selectedAssetIds,
    audience,
    style,
    keywords,
    generating,
    actions,
  };
}

function parseContentType(value: string | null): ContentType {
  if (value === 'image-text') return 'IMAGE_TEXT';
  if (value === 'note' || value === 'short-post') return 'SHORT_POST';
  return 'ARTICLE';
}

function createGeneratedContentDocument(generated: AiGenerated): JSONContent {
  return {
    type: 'doc',
    content: createGeneratedBodyNodes(generated),
  };
}

function createStreamingTextNodes(text: string): JSONContent[] {
  return text
    .split(/(\r?\n)/)
    .filter((item) => item.length > 0)
    .map((item) => (/\r?\n/.test(item) ? { type: 'hardBreak' } : { type: 'text', text: item }));
}

function createGeneratedBodyNodes(generated: AiGenerated): JSONContent[] {
  return [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: generated.title }],
    },
    ...generated.body
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: line }],
      })),
  ];
}

function createGeneratedContentHtml(generated: AiGenerated) {
  const paragraphs = generated.body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');

  return `<h2>${escapeHtml(generated.title)}</h2>${paragraphs}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
