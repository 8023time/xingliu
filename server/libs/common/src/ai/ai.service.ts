import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

const candidateSchema = z.object({
  candidates: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        summary: z.string().min(1).max(1000),
        body: z.string().min(1).max(100000),
        tags: z.array(z.string().min(1).max(30)).max(10),
      }),
    )
    .length(3),
});

export type GeneratedCandidates = z.infer<typeof candidateSchema>['candidates'];

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
  improvements: z.array(z.string().min(1).max(300)).max(10),
});

export type GeneratedQualityEvaluation = z.infer<typeof qualityEvaluationSchema>;

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
export class AiService {
  private readonly model: ChatOpenAI | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const baseURL = this.configService.get<string>('OPENAI_BASE_URL');
    const model = this.configService.get<string>('OPENAI_MODEL');
    this.model =
      apiKey && baseURL && model
        ? new ChatOpenAI({
            apiKey,
            model,
            temperature: 0.7,
            configuration: { baseURL },
          })
        : null;
  }

  async generateCandidates(instruction: string): Promise<GeneratedCandidates> {
    if (!this.model) {
      throw new ServiceUnavailableException('AI 生成服务未配置');
    }

    const structuredModel = this.model.withStructuredOutput(candidateSchema, {
      name: 'content_candidates',
    });
    const result = await structuredModel.invoke([
      {
        role: 'system',
        content: '你是内容创作助手。严格返回 3 个彼此有明显差异的中文图文候选，不得包含违法违规、危险操作或虚构事实。',
      },
      { role: 'user', content: instruction },
    ]);

    return candidateSchema.parse(result).candidates;
  }

  async evaluateQuality(content: { title: string; summary: string | null; body: string }) {
    if (!this.model) {
      throw new ServiceUnavailableException('AI 评分服务未配置');
    }

    const structuredModel = this.model.withStructuredOutput(qualityEvaluationSchema, {
      name: 'quality_evaluation',
    });
    const result = await structuredModel.invoke([
      {
        role: 'system',
        content:
          '你是严格的中文内容质量评审员。按主题相关性、结构完整性、可读性、原创表达、实用价值评分。总分和各维度均为 0-100，等级规则为 S>=90、A>=80、B>=70、C>=60、D<60。',
      },
      {
        role: 'user',
        content: [`标题：${content.title}`, content.summary ? `摘要：${content.summary}` : '', `正文：${content.body}`]
          .filter(Boolean)
          .join('\n'),
      },
    ]);

    return qualityEvaluationSchema.parse(result);
  }

  async rewriteContent(input: {
    title: string;
    summary: string | null;
    body: string;
    riskLabels: unknown;
    riskSpans: unknown;
    reason: string | null;
  }): Promise<GeneratedRewrite> {
    if (!this.model) {
      throw new ServiceUnavailableException('AI 改写服务未配置');
    }

    const structuredModel = this.model.withStructuredOutput(rewriteSchema, {
      name: 'compliance_rewrite',
    });
    const result = await structuredModel.invoke([
      {
        role: 'system',
        content:
          '你是中文内容合规改写助手。只降低合规风险，保留原意、结构和事实边界。不得新增未经提供的事实，不得输出违法违规内容。',
      },
      {
        role: 'user',
        content: [
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
      },
    ]);

    return rewriteSchema.parse(result);
  }
}
