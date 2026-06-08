import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, QualityAiService, ResponseService } from '@libs/common';
import {
  AiTaskStatus,
  AiTaskType,
  ContentStatus,
  QualityLevel,
  SafetyReviewDecision,
  SafetyStatus,
} from '@libs/common/generated/prisma/enums';

const evaluationSelect = {
  id: true,
  contentId: true,
  contentVersionId: true,
  totalScore: true,
  level: true,
  standardVersion: true,
  dimensions: true,
  summary: true,
  improvements: true,
  createdAt: true,
} as const;

@Injectable()
export class QualityService {
  constructor(
    private readonly qualityAiService: QualityAiService,
    private readonly prismaService: PrismaService,
    private readonly responseService: ResponseService,
  ) {}

  async evaluate(userId: string, contentId: string, wrapResponse = true) {
    const context = await this.getEvaluationContext(userId, contentId);
    const existing = await this.prismaService.qualityEvaluation.findFirst({
      where: { contentVersionId: context.version.id },
      select: evaluationSelect,
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      return wrapResponse ? this.responseService.success(existing, '当前版本已有质量评分') : existing;
    }

    const task = await this.prismaService.aiTask.create({
      data: {
        userId,
        contentId,
        taskType: AiTaskType.SCORE,
        status: AiTaskStatus.RUNNING,
        modelProvider: 'volcengine_ark',
        modelName: process.env['OPENAI_MODEL'],
        inputSummary: `评分内容版本 v${context.version.versionNo}`,
      },
      select: { id: true },
    });
    const startedAt = Date.now();

    try {
      const generated = await this.qualityAiService.evaluateQuality(context.version);
      const expectedLevel = toQualityLevel(generated.totalScore);
      if (generated.level !== expectedLevel) {
        throw new BadRequestException('AI 评分等级与总分不一致');
      }

      const evaluation = await this.prismaService.$transaction(async (transaction) => {
        const created = await transaction.qualityEvaluation.create({
          data: {
            contentId,
            contentVersionId: context.version.id,
            aiTaskId: task.id,
            totalScore: generated.totalScore,
            level: expectedLevel,
            standardVersion: 'quality-standard-v1',
            dimensions: generated.dimensions,
            summary: generated.summary,
            improvements: generated.improvements,
          },
          select: evaluationSelect,
        });
        const updated = await transaction.content.updateMany({
          where: {
            id: contentId,
            currentVersionId: context.version.id,
            safetyStatus: SafetyStatus.PASS,
          },
          data: {
            status: ContentStatus.APPROVED,
            qualityLevel: expectedLevel,
            qualityScore: generated.totalScore,
          },
        });
        if (updated.count !== 1) {
          throw new ConflictException('当前版本或安全状态已变化，评分结果未覆盖新版本状态');
        }
        await transaction.aiTask.update({
          where: { id: task.id },
          data: {
            status: AiTaskStatus.SUCCESS,
            outputSummary: `质量评分：${generated.totalScore} / ${expectedLevel}`,
            durationMs: Date.now() - startedAt,
          },
        });
        return created;
      });

      return wrapResponse ? this.responseService.success(evaluation, '质量评分完成') : evaluation;
    } catch (error) {
      await this.prismaService.aiTask.update({
        where: { id: task.id },
        data: {
          status: AiTaskStatus.FAILED,
          durationMs: Date.now() - startedAt,
          errorCode: 'QUALITY_EVALUATION_FAILED',
          errorMessage: error instanceof Error ? error.message.slice(0, 500) : '质量评分失败',
        },
      });
      throw error;
    }
  }

  private async getEvaluationContext(userId: string, contentId: string) {
    const content = await this.prismaService.content.findFirst({
      where: { id: contentId, authorId: userId, deletedAt: null },
      select: {
        id: true,
        currentVersionId: true,
        safetyStatus: true,
        currentVersion: {
          select: { id: true, versionNo: true, title: true, summary: true, body: true },
        },
      },
    });
    if (!content?.currentVersionId || !content.currentVersion) {
      throw new NotFoundException('当前正式版本不存在或无权操作');
    }
    if (content.safetyStatus !== SafetyStatus.PASS) {
      throw new BadRequestException('当前版本安全审核未通过，不能执行质量评分');
    }

    const safetyReview = await this.prismaService.safetyReview.findFirst({
      where: { contentVersionId: content.currentVersionId },
      select: { decision: true },
      orderBy: { createdAt: 'desc' },
    });
    if (safetyReview?.decision !== SafetyReviewDecision.PASS) {
      throw new BadRequestException('当前版本缺少通过的安全审核结果');
    }
    return { version: content.currentVersion };
  }
}

function toQualityLevel(score: number) {
  if (score >= 90) return QualityLevel.S;
  if (score >= 80) return QualityLevel.A;
  if (score >= 70) return QualityLevel.B;
  if (score >= 60) return QualityLevel.C;
  return QualityLevel.D;
}
