/**
 * 内容类型。
 */
export type ContentType = 'ARTICLE' | 'IMAGE_TEXT' | 'SHORT_POST';

/**
 * 内容状态。
 */
export type ContentStatus = 'DRAFT' | 'REVIEWING' | 'NEED_REWRITE' | 'REJECTED' | 'APPROVED' | 'PUBLISHED' | 'OFFLINE';

/**
 * 草稿保存来源。
 */
export type DraftSavedFrom = 'AUTO' | 'MANUAL' | 'OFFLINE_SYNC';

/**
 * 审核状态。
 */
export type SafetyStatus = 'PENDING' | 'PASS' | 'REJECT';

/**
 * 审核决策。
 */
export type SafetyDecision = 'PASS' | 'NEED_REWRITE' | 'REJECT';

/**
 * 风险等级。
 */
export type RiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * 质量等级。
 */
export type QualityLevel = 'S' | 'A' | 'B' | 'C' | 'D';

/**
 * 内容互动类型。
 */
export type ContentInteractionType = 'VIEW' | 'LIKE' | 'SHARE' | 'COLLECT' | 'DISLIKE' | 'REPORT';

/**
 * 内容条目完整字段，作为前后端共享类型的维护入口。
 */
interface Content {
  id: string;
  authorId: string;
  contentType: ContentType;
  title: string;
  summary: string | null;
  coverAssetId: string | null;
  currentVersionId: string | null;
  publishedVersionId: string | null;
  status: ContentStatus;
  safetyStatus: SafetyStatus;
  safetyScore: string | null;
  qualityLevel: string | null;
  qualityScore: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 内容版本完整字段。
 */
interface ContentVersion {
  id: string;
  contentId: string;
  versionNo: number;
  title: string;
  summary: string | null;
  body: string;
  createdAt: string;
}

/**
 * 安全审核完整字段。
 */
interface SafetyReview {
  id: string;
  contentVersionId: string;
  decision: SafetyDecision;
  riskLevel: RiskLevel;
  riskCategories: string[] | null;
  riskSpans: Array<{ index: number; text: string }> | null;
  safetyScore: string;
  reason: string | null;
  providerRequestId: string | null;
  createdAt: string;
}

/**
 * 质量评分完整字段。
 */
interface QualityEvaluation {
  id: string;
  contentId: string;
  contentVersionId: string;
  totalScore: string;
  level: QualityLevel;
  standardVersion: string;
  dimensions: Record<string, number>;
  summary: string | null;
  improvements: string[] | null;
  createdAt: string;
}

/**
 * 合规改写完整字段。
 */
interface Rewrite {
  id: string;
  contentId: string;
  userId: string | null;
  sourceVersionId: string;
  rewrittenVersionId: string | null;
  aiTaskId: string | null;
  rewrittenTitle: string;
  rewrittenBody: string;
  changedSpans: Array<{ before: string; after: string; reason: string }> | null;
  reason: string | null;
  accepted: boolean;
  createdAt: string;
}

/**
 * 草稿快照完整字段。
 */
interface DraftSnapshot {
  id: string;
  contentId: string;
  userId: string;
  baseVersionId: string | null;
  title: string;
  summary: string | null;
  body: string;
  bodyJson: Record<string, unknown> | null;
  assetIds: string[] | null;
  clientRevision: number;
  serverRevision: number;
  syncStatus: 'SYNCED' | 'PENDING' | 'CONFLICT';
  savedFrom: DraftSavedFrom;
  createdAt: string;
}

/**
 * 内容分页查询字段。
 */
interface ContentQuery {
  page: number;
  pageSize: number;
  contentType: ContentType;
  status: ContentStatus;
}

/**
 * 公开内容流查询字段。
 */
interface PublicFeedQuery {
  cursor: string;
  limit: number;
}

/**
 * 内容分页响应字段。
 */
interface ContentPageData {
  page: number;
  pageSize: number;
  total: number;
  items: ContentRecord[];
}

/**
 * 内容互动计数字段。
 */
interface ContentMetrics {
  viewCount: number;
  likeCount: number;
  shareCount: number;
  collectCount: number;
}

/**
 * 点赞状态返回字段。
 */
interface ContentLikeState {
  contentId: Content['id'];
  liked: boolean;
  likeCount: number;
}

interface ContentViewState {
  contentId: Content['id'];
  viewCount: number;
}

/**
 * 内容列表和详情返回记录。
 */
export type ContentRecord = Content;

/**
 * 内容分页查询参数。
 */
export type ContentQueryRequest = Partial<ContentQuery>;

/**
 * 公开内容流查询参数。
 */
export type PublicFeedQueryRequest = Partial<PublicFeedQuery>;

/**
 * 创建内容请求参数。
 */
export type CreateContentRequest = Pick<Content, 'contentType'> & Partial<Pick<Content, 'title'>>;

/**
 * 更新内容请求参数。
 */
export type UpdateContentRequest = Partial<Pick<Content, 'title' | 'summary' | 'coverAssetId'>>;

/**
 * 安全审核返回记录。
 */
export type SafetyReviewRecord = SafetyReview;

/**
 * 质量评分返回记录。
 */
export type QualityEvaluationRecord = QualityEvaluation;

/**
 * 审核工作流返回结果。
 */
export type ReviewWorkflowResult = {
  safetyReview: SafetyReviewRecord;
  qualityEvaluation: QualityEvaluationRecord | null;
};

/**
 * 合规改写返回记录。
 */
export type RewriteRecord = Rewrite;

/**
 * 接受合规改写返回结果。
 */
export type RewriteAcceptResult = {
  rewriteRecord: RewriteRecord;
  version: ContentVersion;
  safetyReview: SafetyReviewRecord;
  qualityEvaluation: QualityEvaluationRecord | null;
};

/**
 * 草稿快照返回记录。
 */
export type DraftRecord = DraftSnapshot;

/**
 * 保存草稿请求参数。
 */
export type DraftInput = Pick<DraftSnapshot, 'title' | 'body' | 'clientRevision' | 'serverRevision'> &
  Partial<Pick<DraftSnapshot, 'summary' | 'bodyJson' | 'assetIds' | 'baseVersionId' | 'savedFrom'>>;

/**
 * 提交审核请求参数。
 */
export type ReviewContentRequest = {
  draftSnapshotId: DraftSnapshot['id'];
  changeSummary?: string;
};

/**
 * 创建合规改写请求参数。
 */
export type CreateComplianceRewriteRequest = {
  instruction?: string;
};

/**
 * 发布内容返回结果。
 */
export type PublishContentResponse = Pick<Content, 'publishedVersionId' | 'publishedAt'> & {
  contentId: Content['id'];
};

/**
 * 内容分页响应。
 */
export type ContentPage = ContentPageData;

/**
 * 内容互动计数。
 */
export type ContentMetricsRecord = ContentMetrics;

/**
 * 点赞或取消点赞返回结果。
 */
export type ContentLikeStateResponse = ContentLikeState;

export type ContentViewStateResponse = ContentViewState;
