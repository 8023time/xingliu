import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AiService, ModerationService, PrismaService, ResponseService } from '@libs/common';
import { AiTaskStatus, AiTaskType, CommonStatus, SafetyStatus, Visibility } from '@libs/common/generated/prisma/enums';
import { CreateAiGenerationDto } from './dto/create-ai-generation.dto';

@Injectable()
export class AiGenerationService {
  constructor(
    private readonly aiService: AiService,
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
      const generated = await this.aiService.generateCandidates(this.buildInstruction(dto, context));
      const candidates = await Promise.all(
        generated.map(async (candidate) => {
          await this.assertTextPass(
            [candidate.title, candidate.summary, candidate.body, candidate.tags.join(' ')].join('\n'),
          );
          return { id: randomUUID(), ...candidate };
        }),
      );

      await this.prismaService.$transaction([
        this.prismaService.aiTask.update({
          where: { id: task.id },
          data: {
            status: AiTaskStatus.SUCCESS,
            outputSummary: `生成并审核通过 ${candidates.length} 个候选`,
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
          candidates,
        },
        'AI 候选生成成功',
      );
    } catch (error) {
      await this.prismaService.aiTask.update({
        where: { id: task.id },
        data: {
          status: AiTaskStatus.FAILED,
          durationMs: Date.now() - startedAt,
          errorCode: error instanceof BadRequestException ? 'MODERATION_REJECTED' : 'GENERATION_FAILED',
          errorMessage: error instanceof Error ? error.message.slice(0, 500) : 'AI 候选生成失败',
        },
      });
      throw error;
    }
  }

  private async getGenerationContext(userId: string, dto: CreateAiGenerationDto) {
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
      '请生成 3 个候选，每个包含 title、summary、body、tags。不得声称使用未提供的事实。',
    ]
      .filter(Boolean)
      .join('\n');
  }
}
