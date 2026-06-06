/**
 * Prompt 可见性。
 */
export type PromptVisibility = 'PRIVATE' | 'PUBLIC' | 'SYSTEM';

/**
 * Prompt 模板完整字段，作为前后端共享类型的维护入口。
 */
interface PromptTemplate {
  id: string;
  ownerId: string | null;
  name: string;
  category: string;
  description: string | null;
  template: string;
  variablesSchema: Record<string, unknown> | null;
  modelConfig: Record<string, unknown> | null;
  visibility: PromptVisibility;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Prompt 分页查询字段。
 */
interface PromptQuery {
  page: number;
  pageSize: number;
  category: string;
}

/**
 * Prompt 分页响应字段。
 */
interface PromptPageData {
  page: number;
  pageSize: number;
  total: number;
  items: PromptRecord[];
}

/**
 * Prompt 列表和详情返回记录。
 */
export type PromptRecord = PromptTemplate;

/**
 * Prompt 分页查询参数。
 */
export type PromptQueryRequest = Partial<PromptQuery>;

/**
 * 创建 Prompt 请求参数。
 */
export type PromptInput = Pick<PromptTemplate, 'name' | 'category' | 'template'> &
  Partial<Pick<PromptTemplate, 'description' | 'variablesSchema' | 'modelConfig'>>;

/**
 * 更新 Prompt 请求参数。
 */
export type UpdatePromptRequest = Partial<PromptInput>;

/**
 * Prompt 分页响应。
 */
export type PromptPage = PromptPageData;
