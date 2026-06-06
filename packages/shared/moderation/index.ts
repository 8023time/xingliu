/**
 * 通用预检对象类型。
 */
export type ModerationSubjectType = 'prompt' | 'content' | 'asset';

/**
 * 通用预检完整字段。
 */
interface ModerationCheck {
  subjectType: ModerationSubjectType;
  subjectId: string;
  text: string;
  assetUrl: string;
}

/**
 * 通用预检请求参数。
 */
export type ModerationCheckRequest = Pick<ModerationCheck, 'subjectType'> &
  Partial<Pick<ModerationCheck, 'subjectId' | 'text' | 'assetUrl'>>;
