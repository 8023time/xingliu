/**
 * AI 生成内容完整字段。
 */
interface AiGeneratedContent {
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
  content: AiGeneratedContent;
}

/**
 * AI 生成内容。
 */
export type AiGenerated = AiGeneratedContent;

/**
 * AI 生成请求参数。
 */
export type AiGenerateInput = Pick<AiGeneration, 'contentId' | 'topic' | 'promptId'> &
  Partial<Pick<AiGeneration, 'assetIds' | 'audience' | 'style' | 'keywords'>>;

/**
 * AI 生成响应。
 */
export type AiGenerateResponse = AiGenerationResult;
