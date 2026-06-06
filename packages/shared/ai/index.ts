/**
 * AI 候选内容完整字段。
 */
interface AiCandidateContent {
  id: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
}

/**
 * AI 生成请求完整字段。
 */
interface AiGeneration {
  contentId: string;
  topic: string;
  promptId: string;
  assetIds: string[];
  audience: string;
  style: string;
  keywords: string[];
}

/**
 * AI 生成响应完整字段。
 */
interface AiGenerationResult {
  taskId: string;
  candidates: AiCandidate[];
}

/**
 * AI 生成候选内容。
 */
export type AiCandidate = AiCandidateContent;

/**
 * AI 生成请求参数。
 */
export type AiGenerateInput = Pick<AiGeneration, 'contentId' | 'topic' | 'promptId'> &
  Partial<Pick<AiGeneration, 'assetIds' | 'audience' | 'style' | 'keywords'>>;

/**
 * AI 生成响应。
 */
export type AiGenerateResponse = AiGenerationResult;
