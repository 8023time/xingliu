import type {
  ContentPage,
  ContentQueryRequest,
  ContentRecord,
  CreateComplianceRewriteRequest,
  CreateContentRequest,
  DraftInput,
  DraftRecord,
  PublishContentResponse,
  QualityEvaluationRecord,
  ReviewContentRequest,
  ReviewWorkflowResult,
  RewriteAcceptResult,
  RewriteRecord,
  UpdateContentRequest,
} from '@xingliu/shared/content';
import type { ResponseFormat } from '@xingliu/shared/common';
import http from '@/configs/request';

export type {
  ContentPage,
  ContentQueryRequest,
  ContentRecord,
  ContentStatus,
  ContentType,
  CreateComplianceRewriteRequest,
  CreateContentRequest,
  DraftInput,
  DraftRecord,
  DraftSavedFrom,
  PublishContentResponse,
  QualityEvaluationRecord,
  ReviewContentRequest,
  ReviewWorkflowResult,
  RewriteAcceptResult,
  RewriteRecord,
  SafetyDecision,
  SafetyReviewRecord,
  SafetyStatus,
  UpdateContentRequest,
} from '@xingliu/shared/content';

/**
 * 获取内容列表接口
 * GET /api/contents
 */
export async function getContentsApi(query: ContentQueryRequest): Promise<ResponseFormat<ContentPage>> {
  return http.get('/contents', { params: query });
}

/**
 * 创建内容接口
 * POST /api/contents
 */
export async function createContentApi(data: CreateContentRequest): Promise<ResponseFormat<ContentRecord>> {
  return http.post('/contents', data);
}

/**
 * 获取内容详情接口
 * GET /api/contents/:id
 */
export async function getContentApi(id: string): Promise<ResponseFormat<ContentRecord>> {
  return http.get(`/contents/${id}`);
}

/**
 * 更新内容接口
 * PATCH /api/contents/:id
 */
export async function updateContentApi(id: string, data: UpdateContentRequest): Promise<ResponseFormat<ContentRecord>> {
  return http.patch(`/contents/${id}`, data);
}

/**
 * 删除内容接口
 * DELETE /api/contents/:id
 */
export async function deleteContentApi(id: string): Promise<ResponseFormat<null>> {
  return http.delete(`/contents/${id}`);
}

/**
 * 获取最新草稿接口
 * GET /api/contents/:contentId/drafts/latest
 */
export async function getLatestDraftApi(contentId: string): Promise<ResponseFormat<DraftRecord | null>> {
  return http.get(`/contents/${contentId}/drafts/latest`);
}

/**
 * 保存草稿接口
 * POST /api/contents/:contentId/drafts
 */
export async function saveDraftApi(contentId: string, data: DraftInput): Promise<ResponseFormat<DraftRecord>> {
  return http.post(`/contents/${contentId}/drafts`, data);
}

/**
 * 同步草稿接口
 * POST /api/contents/:contentId/drafts/sync
 */
export async function syncDraftApi(contentId: string, data: DraftInput): Promise<ResponseFormat<DraftRecord>> {
  return http.post(`/contents/${contentId}/drafts/sync`, data);
}

/**
 * 提交内容审核接口
 * POST /api/contents/:contentId/review
 */
export async function reviewContentApi(
  contentId: string,
  data: ReviewContentRequest,
): Promise<ResponseFormat<ReviewWorkflowResult>> {
  return http.post(`/contents/${contentId}/review`, data);
}

/**
 * 触发质量评分接口
 * POST /api/contents/:contentId/quality-evaluation
 */
export async function evaluateContentQualityApi(contentId: string): Promise<ResponseFormat<QualityEvaluationRecord>> {
  return http.post(`/contents/${contentId}/quality-evaluation`);
}

/**
 * 创建合规改写接口
 * POST /api/contents/:contentId/compliance-rewrite
 */
export async function createComplianceRewriteApi(
  contentId: string,
  data?: CreateComplianceRewriteRequest,
): Promise<ResponseFormat<RewriteRecord>> {
  return http.post(`/contents/${contentId}/compliance-rewrite`, data ?? {});
}

/**
 * 接受合规改写接口
 * POST /api/contents/:contentId/compliance-rewrite/:rewriteId/accept
 */
export async function acceptComplianceRewriteApi(
  contentId: string,
  rewriteId: string,
): Promise<ResponseFormat<RewriteAcceptResult>> {
  return http.post(`/contents/${contentId}/compliance-rewrite/${rewriteId}/accept`);
}

/**
 * 发布内容接口
 * POST /api/contents/:contentId/publish
 */
export async function publishContentApi(contentId: string): Promise<ResponseFormat<PublishContentResponse>> {
  return http.post(`/contents/${contentId}/publish`);
}

/**
 * 下线内容接口
 * POST /api/contents/:contentId/offline
 */
export async function offlineContentApi(contentId: string): Promise<ResponseFormat<ContentRecord>> {
  return http.post(`/contents/${contentId}/offline`);
}
