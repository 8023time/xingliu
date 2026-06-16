import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ContentGenerationAiService, ModerationService, PrismaService, ResponseService } from '@libs/common';
import { AiTaskStatus, AiTaskType, CommonStatus, SafetyStatus, Visibility } from '@libs/common/generated/prisma/enums';
import { CreateAiGenerationDto } from './dto/create-ai-generation.dto';

type AiGenerationStreamEvent =
  | { type: 'task'; data: { taskId: string } }
  | { type: 'delta'; data: { text: string } }
  | { type: 'body_delta'; data: { text: string } }
  | {
      type: 'done';
      data: {
        taskId: string;
        content: {
          id: string;
          title: string;
          summary: string;
          body: string;
          tags: string[];
        };
      };
    }
  | { type: 'error'; data: { message: string } };

@Injectable()
export class AiGenerationService {
  constructor(
    private readonly contentGenerationAiService: ContentGenerationAiService,
    private readonly moderationService: ModerationService,
    private readonly prismaService: PrismaService,
    private readonly responseService: ResponseService,
  ) {}

  async create(userId: string, dto: CreateAiGenerationDto) {
    const context = await this.getGenerationContext(userId, dto);

    const task = await this.prismaService.aiTask.create({
      data: {
        userId,
        contentId: dto.contentId,
        promptId: dto.promptId,
        taskType: AiTaskType.GENERATE,
        status: AiTaskStatus.RUNNING,
        modelProvider: 'volcengine_ark',
        modelName: process.env['OPENAI_MODEL'],
        inputSummary: `主题：${dto.topic.slice(0, 120)}；素材数：${context.assets.length}`,
      },
      select: { id: true, createdAt: true },
    });
    const startedAt = Date.now();

    try {
      await this.assertTextPass(this.buildInputModerationText(dto, context.prompt.template));
      const generated = await this.contentGenerationAiService.generateContent(this.buildInstruction(dto, context));
      await this.assertTextPass(
        [generated.title, generated.summary, generated.body, generated.tags.join(' ')].join('\n'),
      );
      const generatedContent = { id: randomUUID(), ...generated };

      await this.prismaService.$transaction([
        this.prismaService.aiTask.update({
          where: { id: task.id },
          data: {
            status: AiTaskStatus.SUCCESS,
            outputSummary: `生成并审核通过内容：${generatedContent.title.slice(0, 80)}`,
            durationMs: Date.now() - startedAt,
          },
        }),
        this.prismaService.promptTemplate.update({
          where: { id: dto.promptId },
          data: { usageCount: { increment: 1 } },
        }),
      ]);

      return this.responseService.success(
        {
          taskId: task.id,
          content: generatedContent,
        },
        'AI 内容生成成功',
      );
    } catch (error) {
      await this.prismaService.aiTask.update({
        where: { id: task.id },
        data: {
          status: AiTaskStatus.FAILED,
          durationMs: Date.now() - startedAt,
          errorCode: error instanceof BadRequestException ? 'MODERATION_REJECTED' : 'GENERATION_FAILED',
          errorMessage: error instanceof Error ? error.message.slice(0, 500) : 'AI 内容生成失败',
        },
      });
      throw error;
    }
  }

  async *createStream(userId: string, dto: CreateAiGenerationDto): AsyncGenerator<AiGenerationStreamEvent> {
    let task: { id: string; createdAt: Date } | null = null;
    let startedAt = Date.now();

    try {
      const context = await this.getGenerationContext(userId, dto);

      task = await this.prismaService.aiTask.create({
        data: {
          userId,
          contentId: dto.contentId,
          promptId: dto.promptId,
          taskType: AiTaskType.GENERATE,
          status: AiTaskStatus.RUNNING,
          modelProvider: 'volcengine_ark',
          modelName: process.env['OPENAI_MODEL'],
          inputSummary: `主题：${dto.topic.slice(0, 120)}；素材数：${context.assets.length}`,
        },
        select: { id: true, createdAt: true },
      });
      startedAt = Date.now();

      yield { type: 'task', data: { taskId: task.id } };

      await this.assertTextPass(this.buildInputModerationText(dto, context.prompt.template));

      let rawContent = '';
      let streamedBody = '';
      for await (const delta of this.contentGenerationAiService.streamContent(this.buildInstruction(dto, context))) {
        rawContent += delta;
        yield { type: 'delta', data: { text: delta } };

        const body = extractJsonStringField(rawContent, 'body');
        if (body.length > streamedBody.length) {
          const bodyDelta = body.slice(streamedBody.length);
          streamedBody = body;
          yield { type: 'body_delta', data: { text: bodyDelta } };
        }
      }

      const generated = this.contentGenerationAiService.parseGeneratedContent(rawContent);
      await this.assertTextPass(
        [generated.title, generated.summary, generated.body, generated.tags.join(' ')].join('\n'),
      );

      const generatedContent = { id: randomUUID(), ...generated };

      await this.prismaService.$transaction([
        this.prismaService.aiTask.update({
          where: { id: task.id },
          data: {
            status: AiTaskStatus.SUCCESS,
            outputSummary: `生成并审核通过内容：${generatedContent.title.slice(0, 80)}`,
            durationMs: Date.now() - startedAt,
          },
        }),
        this.prismaService.promptTemplate.update({
          where: { id: dto.promptId },
          data: { usageCount: { increment: 1 } },
        }),
      ]);

      yield {
        type: 'done',
        data: {
          taskId: task.id,
          content: generatedContent,
        },
      };
    } catch (error) {
      if (task) {
        await this.prismaService.aiTask.update({
          where: { id: task.id },
          data: {
            status: AiTaskStatus.FAILED,
            durationMs: Date.now() - startedAt,
            errorCode: error instanceof BadRequestException ? 'MODERATION_REJECTED' : 'GENERATION_FAILED',
            errorMessage: this.getErrorMessage(error).slice(0, 500),
          },
        });
      }

      yield { type: 'error', data: { message: this.getErrorMessage(error) } };
    }
  }

  /**
   * 获取 AI 生成所需的上下文信息，包括内容、Prompt 模板和素材，并进行权限校验和安全检查。若内容或 Prompt 不存在或无权访问，或素材包含未审核通过的，则抛出相应异常。
   * @param userId 用户 ID
   * @param dto 创建 AI 生成任务的 DTO
   * @returns 包含内容、Prompt 模板和素材的上下文对象
   * @throws NotFoundException 内容或 Prompt 不存在或无权访问
   * @throws BadRequestException 包含不存在或无权使用的素材，或素材未审核通过
   */
  private async getGenerationContext(userId: string, dto: CreateAiGenerationDto) {
    // 并行查询内容、Prompt 模板和素材
    const [content, prompt, assets] = await Promise.all([
      this.prismaService.content.findFirst({
        where: { id: dto.contentId, authorId: userId, deletedAt: null },
        select: { id: true, contentType: true },
      }),
      this.prismaService.promptTemplate.findFirst({
        where: {
          id: dto.promptId,
          status: CommonStatus.ACTIVE,
          OR: [{ ownerId: userId }, { visibility: { in: [Visibility.PUBLIC, Visibility.SYSTEM] } }],
        },
        select: { id: true, template: true },
      }),
      this.prismaService.asset.findMany({
        where: { id: { in: dto.assetIds ?? [] }, userId, deletedAt: null },
        select: { id: true, name: true, type: true, aiDescription: true, tags: true, safetyStatus: true },
      }),
    ]);

    if (!content) throw new NotFoundException('内容不存在或无权操作');
    if (!prompt) throw new NotFoundException('Prompt 不存在或无权使用');
    if (assets.length !== new Set(dto.assetIds ?? []).size) {
      throw new BadRequestException('包含不存在或无权使用的素材');
    }
    if (assets.some((asset) => asset.safetyStatus !== SafetyStatus.PASS)) {
      throw new BadRequestException('仅可使用审核通过的素材生成内容');
    }
    return { content, prompt, assets };
  }

  private async assertTextPass(text: string) {
    const result = await this.moderationService.moderateText(text);
    if (result.riskLevel === 'medium' || result.riskLevel === 'high') {
      throw new BadRequestException({
        message: '内容预检未通过',
        moderation: {
          decision: result.riskLevel === 'high' ? 'reject' : 'need_rewrite',
          riskLevel: result.riskLevel,
          labels: result.labels,
          reason: result.reason,
          riskSpans: result.riskSpans,
        },
      });
    }
  }

  private buildInputModerationText(dto: CreateAiGenerationDto, promptTemplate: string) {
    return [promptTemplate, dto.topic, dto.audience, dto.style, ...(dto.keywords ?? [])].filter(Boolean).join('\n');
  }

  private buildInstruction(
    dto: CreateAiGenerationDto,
    context: Awaited<ReturnType<AiGenerationService['getGenerationContext']>>,
  ) {
    const assetContext = context.assets.map((asset) => ({
      name: asset.name,
      type: asset.type,
      description: asset.aiDescription,
      tags: asset.tags,
    }));

    return [
      `Prompt 模板：${context.prompt.template}`,
      `内容类型：${context.content.contentType}`,
      `主题：${dto.topic}`,
      dto.audience ? `目标受众：${dto.audience}` : '',
      dto.style ? `表达风格：${dto.style}` : '',
      dto.keywords?.length ? `关键词：${dto.keywords.join('、')}` : '',
      assetContext.length ? `可用素材摘要：${JSON.stringify(assetContext)}` : '',
      '请生成一篇可直接进入编辑器继续编辑的内容，包含 title、summary、body、tags。不得声称使用未提供的事实。',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof BadRequestException) {
      const response = error.getResponse();
      if (typeof response === 'string') return response;
      if (response && typeof response === 'object' && 'message' in response) {
        const message = response.message;
        if (typeof message === 'string') return message;
        if (Array.isArray(message)) return message.join('；');
      }
    }

    return error instanceof Error ? error.message : 'AI 内容生成失败';
  }
}

function extractJsonStringField(content: string, fieldName: string) {
  const fieldIndex = content.indexOf(`"${fieldName}"`);
  if (fieldIndex < 0) return '';

  const colonIndex = content.indexOf(':', fieldIndex + fieldName.length + 2);
  if (colonIndex < 0) return '';

  const quoteIndex = content.indexOf('"', colonIndex + 1);
  if (quoteIndex < 0) return '';

  let value = '';
  for (let index = quoteIndex + 1; index < content.length; index += 1) {
    const char = content[index];
    if (char === '"') return value;

    if (char !== '\\') {
      value += char;
      continue;
    }

    const next = content[index + 1];
    if (!next) return value;

    if (next === 'n') value += '\n';
    else if (next === 'r') value += '\r';
    else if (next === 't') value += '\t';
    else if (next === 'b') value += '\b';
    else if (next === 'f') value += '\f';
    else if (next === '"' || next === '\\' || next === '/') value += next;
    else if (next === 'u') {
      const hex = content.slice(index + 2, index + 6);
      if (hex.length < 4 || !/^[\da-f]{4}$/i.test(hex)) return value;
      value += String.fromCharCode(Number.parseInt(hex, 16));
      index += 4;
    }

    index += 1;
  }

  return value;
}
