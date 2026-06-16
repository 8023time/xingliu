import { Injectable } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { AiService } from './ai.service';
import { parseJsonObjectResponse } from './json-response';

const generatedContentSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(1000),
  body: z.string().min(1).max(100000),
  tags: z.array(z.string().min(1).max(30)).max(10),
});

export type GeneratedContent = z.infer<typeof generatedContentSchema>;

@Injectable()
export class ContentGenerationAiService {
  constructor(private readonly aiService: AiService) {}

  async generateContent(instruction: string): Promise<GeneratedContent> {
    const model = this.aiService.getModel('AI 生成服务');
    const result = await model.invoke(
      [
        new SystemMessage(
          [
            '你是内容创作助手。根据创作设置生成一篇可直接进入编辑器继续编辑的中文图文内容，不得包含违法违规、危险操作或虚构事实。',
            '只能返回一个 JSON 对象，不要 Markdown、代码块或解释文字。',
            'JSON 结构：{ "title": string, "summary": string, "body": string, "tags": string[] }。',
          ].join('\n'),
        ),
        new HumanMessage(instruction),
      ],
      { callbacks: [] },
    );

    return generatedContentSchema.parse(parseJsonObjectResponse(result));
  }

  async *streamContent(instruction: string): AsyncGenerator<string> {
    const model = this.aiService.getModel('AI 生成服务');
    const stream = await model.stream(
      [
        new SystemMessage(
          [
            '你是内容创作助手。根据创作设置生成一篇可直接进入编辑器继续编辑的中文图文内容，不得包含违法违规、危险操作或虚构事实。',
            '只能返回一个 JSON 对象，不要 Markdown、代码块或解释文字。',
            'JSON 结构：{ "title": string, "summary": string, "body": string, "tags": string[] }。',
          ].join('\n'),
        ),
        new HumanMessage(instruction),
      ],
      { callbacks: [] },
    );

    for await (const chunk of stream) {
      const text = extractChunkText(chunk.content);
      if (text) yield text;
    }
  }

  parseGeneratedContent(content: string): GeneratedContent {
    return generatedContentSchema.parse(parseJsonObjectResponse(content));
  }
}

function extractChunkText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  return content
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'text' in item && typeof item.text === 'string') return item.text;
      return '';
    })
    .join('');
}
