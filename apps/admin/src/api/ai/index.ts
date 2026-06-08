import type { AiGenerateInput, AiGenerateResponse } from '@xingliu/shared/ai';
import type { ResponseFormat } from '@xingliu/shared/common';
import http from '@/configs/request';

export type { AiGenerateInput, AiGenerateResponse, AiGenerated } from '@xingliu/shared/ai';

/**
 * 生成 AI 内容接口
 * POST /api/ai/generate
 */
export async function generateContentApi(data: AiGenerateInput): Promise<ResponseFormat<AiGenerateResponse>> {
  return http.post('/ai/generate', data);
}
