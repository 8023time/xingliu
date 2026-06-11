import { Injectable } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { AiService } from './ai.service';
import { parseJsonObjectResponse } from './json-response';

const qualityEvaluationSchema = z.object({
  totalScore: z.number().min(0).max(100),
  level: z.enum(['S', 'A', 'B', 'C', 'D']),
  dimensions: z.object({
    relevance: z.number().min(0).max(100),
    structure: z.number().min(0).max(100),
    readability: z.number().min(0).max(100),
    originality: z.number().min(0).max(100),
    usefulness: z.number().min(0).max(100),
  }),
  summary: z.string().min(1).max(1000),
  improvements: z.preprocess(normalizeImprovements, z.array(z.string().min(1).max(300)).max(10)),
});

export type GeneratedQualityEvaluation = z.infer<typeof qualityEvaluationSchema>;

@Injectable()
export class QualityAiService {
  constructor(private readonly aiService: AiService) {}

  async evaluateQuality(content: { title: string; summary: string | null; body: string }) {
    const model = this.aiService.getModel('AI 评分服务');
    const result = await model.invoke(
      [
        new SystemMessage(
          [
            '你是严格的中文内容质量评审员。按主题相关性、结构完整性、可读性、原创表达、实用价值评分。总分和各维度均为 0-100，等级规则为 S>=90、A>=80、B>=70、C>=60、D<60。',
            '只能返回一个 JSON 对象，不要 Markdown、代码块或解释文字。',
            'JSON 字段：totalScore、level、dimensions、summary、improvements。',
            'dimensions 字段必须包含 relevance、structure、readability、originality、usefulness。',
            'The improvements field must be a JSON array of strings, not a single string.',
          ].join('\n'),
        ),
        new HumanMessage(
          [`标题：${content.title}`, content.summary ? `摘要：${content.summary}` : '', `正文：${content.body}`]
            .filter(Boolean)
            .join('\n'),
        ),
      ],
      { callbacks: [] },
    );

    return qualityEvaluationSchema.parse(parseJsonObjectResponse(result));
  }
}

function normalizeImprovements(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  const parsed = tryParseJsonArray(trimmed);
  if (parsed) {
    return parsed;
  }

  return trimmed
    .split(/\r?\n|;/)
    .map((item) => item.replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 10);
}

function tryParseJsonArray(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
