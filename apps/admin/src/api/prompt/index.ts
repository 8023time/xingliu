import type {
  PromptInput,
  PromptPage,
  PromptQueryRequest,
  PromptRecord,
  UpdatePromptRequest,
} from '@xingliu/shared/prompt';
import type { ResponseFormat } from '@xingliu/shared/common';
import http from '@/configs/request';

export type {
  PromptInput,
  PromptPage,
  PromptQueryRequest,
  PromptRecord,
  PromptVisibility,
  UpdatePromptRequest,
} from '@xingliu/shared/prompt';

/**
 * 获取 Prompt 列表接口
 * GET /api/prompts
 */
export async function getPromptsApi(query: PromptQueryRequest): Promise<ResponseFormat<PromptPage>> {
  return http.get('/prompts', {
    params: {
      page: query.page,
      pageSize: query.pageSize,
      category: query.category,
    },
  });
}

/**
 * 创建 Prompt 接口
 * POST /api/prompts
 */
export async function createPromptApi(data: PromptInput): Promise<ResponseFormat<PromptRecord>> {
  return http.post('/prompts', data);
}

/**
 * 更新 Prompt 接口
 * PATCH /api/prompts/:id
 */
export async function updatePromptApi(id: string, data: UpdatePromptRequest): Promise<ResponseFormat<PromptRecord>> {
  return http.patch(`/prompts/${id}`, data);
}

/**
 * 删除 Prompt 接口
 * DELETE /api/prompts/:id
 */
export async function deletePromptApi(id: string): Promise<ResponseFormat<null>> {
  return http.delete(`/prompts/${id}`);
}
