import { Injectable } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { AiService } from './ai.service';
import { parseJsonObjectResponse } from './json-response';

const rewriteSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(100000),
  changedSpans: z
    .array(
      z.object({
        before: z.string().min(1).max(1000),
        after: z.string().min(1).max(1000),
        reason: z.string().min(1).max(500),
      }),
    )
    .max(20),
  reason: z.string().min(1).max(1000),
});

export type GeneratedRewrite = z.infer<typeof rewriteSchema>;

@Injectable()
export class RewriteAiService {
  constructor(private readonly aiService: AiService) {}

  async rewriteContent(input: {
    title: string;
    summary: string | null;
    body: string;
    riskLabels: unknown;
    riskSpans: unknown;
    reason: string | null;
  }): Promise<GeneratedRewrite> {
    const model = this.aiService.getModel('AI 改写服务');
    const result = await model.invoke(
      [
        new SystemMessage(
          [
            '你是中文内容合规改写助手。只降低合规风险，保留原意、结构和事实边界。不得新增未经提供的事实，不得输出违法违规内容。',
            '只能返回一个 JSON 对象，不要 Markdown、代码块或解释文字。',
            'JSON 字段：title、body、changedSpans、reason。changedSpans 元素包含 before、after、reason。',
          ].join('\n'),
        ),
        new HumanMessage(
          [
            `标题：${input.title}`,
            input.summary ? `摘要：${input.summary}` : '',
            `正文：${input.body}`,
            `风险标签：${JSON.stringify(input.riskLabels ?? [])}`,
            `风险片段：${JSON.stringify(input.riskSpans ?? [])}`,
            input.reason ? `审核原因：${input.reason}` : '',
            '请返回改写后的 title、body、changedSpans 和 reason。',
          ]
            .filter(Boolean)
            .join('\n'),
        ),
      ],
      { callbacks: [] },
    );

    return rewriteSchema.parse(parseJsonObjectResponse(result));
  }
}
