import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ModerationService,
  PrismaService,
  ResponseService,
  RewriteAiService,
  type TextModerationResult,
} from '@libs/common';
import { Prisma } from '@libs/common/generated/prisma/client';
import {
  AiTaskStatus,
  AiTaskType,
  ChangeType,
  ContentStatus,
  RiskLevel,
  SafetyReviewDecision,
  SafetyStatus,
} from '@libs/common/generated/prisma/enums';
import { CreateRewriteDto } from './dto/create-rewrite.dto';
import { QualityService } from '../quality/quality.service';

const rewriteSelect = {
  id: true,
  contentId: true,
  userId: true,
  sourceVersionId: true,
  rewrittenVersionId: true,
  aiTaskId: true,
  rewrittenTitle: true,
  rewrittenBody: true,
  changedSpans: true,
  reason: true,
  accepted: true,
  createdAt: true,
} as const;

const versionSelect = {
  id: true,
  contentId: true,
  versionNo: true,
  title: true,
  summary: true,
  body: true,
  bodyJson: true,
  assetIds: true,
  coverAssetId: true,
  changeType: true,
  changeSummary: true,
  createdBy: true,
  createdAt: true,
} as const;

@Injectable()
export class RewriteService {
  constructor(
    private readonly rewriteAiService: RewriteAiService,
    private readonly moderationService: ModerationService,
    private readonly prismaService: PrismaService,
    private readonly qualityService: QualityService,
    private readonly responseService: ResponseService,
  ) {}

  async create(userId: string, contentId: string, dto: CreateRewriteDto) {
    const context = await this.getRewriteContext(userId, contentId);
    const task = await this.prismaService.aiTask.create({
      data: {
        userId,
        contentId,
        taskType: AiTaskType.REWRITE,
        status: AiTaskStatus.RUNNING,
        modelProvider: 'volcengine_ark',
        modelName: process.env['OPENAI_MODEL'],
        inputSummary: `改写内容版本 v${context.version.versionNo}`,
      },
      select: { id: true },
    });
    const startedAt = Date.now();

    try {
      const generated = await this.rewriteAiService.rewriteContent({
        title: context.version.title,
        summary: context.version.summary,
        body: context.version.body,
        riskLabels: context.review.riskCategories,
        riskSpans: context.review.riskSpans,
        reason: [context.review.reason, dto.instruction?.trim()].filter(Boolean).join('；') || null,
      });
      await this.assertCandidatePass(generated.title, generated.body);

      const record = await this.prismaService.$transaction(async (transaction) => {
        const created = await transaction.rewriteRecord.create({
          data: {
            contentId,
            userId,
            sourceVersionId: context.version.id,
            aiTaskId: task.id,
            rewrittenTitle: generated.title,
            rewrittenBody: generated.body,
            changedSpans: generated.changedSpans,
            reason: generated.reason,
          },
          select: rewriteSelect,
        });
        await transaction.aiTask.update({
          where: { id: task.id },
          data: {
            status: AiTaskStatus.SUCCESS,
            outputSummary: `生成合规改写候选 ${created.id}`,
            durationMs: Date.now() - startedAt,
          },
        });
        return created;
      });

      return this.responseService.success(record, '合规改写候选生成成功');
    } catch (error) {
      await this.prismaService.aiTask.update({
        where: { id: task.id },
        data: {
          status: AiTaskStatus.FAILED,
          durationMs: Date.now() - startedAt,
          errorCode: error instanceof BadRequestException ? 'REWRITE_MODERATION_REJECTED' : 'REWRITE_FAILED',
          errorMessage: error instanceof Error ? error.message.slice(0, 500) : '合规改写失败',
        },
      });
      throw error;
    }
  }

  async accept(userId: string, contentId: string, rewriteId: string) {
    const accepted = await this.acceptRewriteRecord(userId, contentId, rewriteId);
    const task = await this.prismaService.aiTask.create({
      data: {
        userId,
        contentId,
        taskType: AiTaskType.MODERATE,
        status: AiTaskStatus.RUNNING,
        modelProvider: 'aliyun_green',
        inputSummary: `采纳改写后审核内容版本 v${accepted.version.versionNo}`,
      },
      select: { id: true },
    });
    const startedAt = Date.now();

    try {
      const moderation = await this.moderationService.moderateText(
        [accepted.version.title, accepted.version.summary, accepted.version.body].filter(Boolean).join('\n'),
      );
      const safetyReview = await this.saveReviewResult(contentId, accepted.version.id, task.id, moderation, startedAt);
      const qualityEvaluation =
        safetyReview.decision === SafetyReviewDecision.PASS
          ? await this.qualityService.evaluate(userId, contentId, false)
          : null;

      return this.responseService.success(
        { rewriteRecord: accepted.record, version: accepted.version, safetyReview, qualityEvaluation },
        '已采纳改写并完成重审',
      );
    } catch (error) {
      const taskState = await this.prismaService.aiTask.findUnique({
        where: { id: task.id },
        select: { status: true },
      });
      if (taskState?.status === AiTaskStatus.RUNNING) {
        await this.prismaService.aiTask.update({
          where: { id: task.id },
          data: {
            status: AiTaskStatus.FAILED,
            durationMs: Date.now() - startedAt,
            errorCode: 'REWRITE_REVIEW_FAILED',
            errorMessage: error instanceof Error ? error.message.slice(0, 500) : '改写重审失败',
          },
        });
      }
      throw error;
    }
  }

  private async getRewriteContext(userId: string, contentId: string) {
    const content = await this.prismaService.content.findFirst({
      where: { id: contentId, authorId: userId, deletedAt: null },
      select: {
        id: true,
        status: true,
        currentVersionId: true,
        currentVersion: {
          select: { id: true, versionNo: true, title: true, summary: true, body: true },
        },
      },
    });
    if (!content?.currentVersionId || !content.currentVersion) {
      throw new NotFoundException('当前正式版本不存在或无权操作');
    }
    if (content.status !== ContentStatus.NEED_REWRITE) {
      throw new BadRequestException('仅需改写的内容可生成合规改写候选');
    }

    const review = await this.prismaService.safetyReview.findFirst({
      where: { contentVersionId: content.currentVersionId },
      select: { decision: true, riskCategories: true, riskSpans: true, reason: true },
      orderBy: { createdAt: 'desc' },
    });
    if (review?.decision !== SafetyReviewDecision.NEED_REWRITE) {
      throw new BadRequestException('当前版本缺少需改写的安全审核结果');
    }
    return { version: content.currentVersion, review };
  }

  private async assertCandidatePass(title: string, body: string) {
    const result = await this.moderationService.moderateText([title, body].join('\n'));
    if (result.riskLevel === 'medium' || result.riskLevel === 'high') {
      throw new BadRequestException('改写候选仍未通过合规预检');
    }
  }

  private async acceptRewriteRecord(userId: string, contentId: string, rewriteId: string) {
    try {
      return await this.prismaService.$transaction(async (transaction) => {
        const [content, record, latestVersion] = await Promise.all([
          transaction.content.findFirst({
            where: { id: contentId, authorId: userId, deletedAt: null },
            select: {
              id: true,
              currentVersionId: true,
              coverAssetId: true,
              status: true,
              currentVersion: {
                select: { id: true, summary: true, bodyJson: true, assetIds: true, coverAssetId: true },
              },
            },
          }),
          transaction.rewriteRecord.findFirst({
            where: { id: rewriteId, contentId, userId, accepted: false, rewrittenVersionId: null },
            select: rewriteSelect,
          }),
          transaction.contentVersion.findFirst({
            where: { contentId },
            select: { versionNo: true },
            orderBy: { versionNo: 'desc' },
          }),
        ]);

        if (!content?.currentVersionId || !content.currentVersion) {
          throw new NotFoundException('当前正式版本不存在或无权操作');
        }
        if (!record) {
          throw new NotFoundException('改写候选不存在或已采纳');
        }
        if (content.status !== ContentStatus.NEED_REWRITE || record.sourceVersionId !== content.currentVersionId) {
          throw new ConflictException('当前版本已变化，不能采纳旧改写候选');
        }

        const version = await transaction.contentVersion.create({
          data: {
            contentId,
            versionNo: (latestVersion?.versionNo ?? 0) + 1,
            title: record.rewrittenTitle,
            summary: content.currentVersion.summary,
            body: record.rewrittenBody,
            bodyJson: Prisma.JsonNull,
            assetIds: content.currentVersion.assetIds ?? Prisma.JsonNull,
            coverAssetId: content.currentVersion.coverAssetId ?? content.coverAssetId,
            changeType: ChangeType.REWRITE,
            changeSummary: record.reason,
            createdBy: userId,
          },
          select: versionSelect,
        });
        const updatedRecord = await transaction.rewriteRecord.update({
          where: { id: record.id },
          data: { accepted: true, rewrittenVersionId: version.id },
          select: rewriteSelect,
        });
        await transaction.content.update({
          where: { id: contentId },
          data: {
            currentVersionId: version.id,
            status: ContentStatus.REVIEWING,
            safetyStatus: SafetyStatus.PENDING,
            safetyScore: null,
            qualityLevel: null,
            qualityScore: null,
            title: version.title,
            summary: version.summary,
          },
        });
        return { record: updatedRecord, version };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('内容版本已更新，请刷新后重新操作');
      }
      throw error;
    }
  }

  private async saveReviewResult(
    contentId: string,
    contentVersionId: string,
    taskId: string,
    moderation: TextModerationResult,
    startedAt: number,
  ) {
    const decision = toReviewDecision(moderation.riskLevel);
    const status =
      decision === SafetyReviewDecision.PASS
        ? ContentStatus.REVIEWING
        : decision === SafetyReviewDecision.NEED_REWRITE
          ? ContentStatus.NEED_REWRITE
          : ContentStatus.REJECTED;
    const safetyStatus = decision === SafetyReviewDecision.PASS ? SafetyStatus.PASS : SafetyStatus.REJECT;

    return this.prismaService.$transaction(async (transaction) => {
      const review = await transaction.safetyReview.create({
        data: buildSafetyReviewData(contentId, contentVersionId, taskId, moderation),
        select: {
          id: true,
          contentVersionId: true,
          decision: true,
          riskLevel: true,
          riskCategories: true,
          riskSpans: true,
          safetyScore: true,
          reason: true,
          providerRequestId: true,
          createdAt: true,
        },
      });
      const updated = await transaction.content.updateMany({
        where: { id: contentId, currentVersionId: contentVersionId },
        data: { status, safetyStatus, safetyScore: toSafetyScore(moderation.riskLevel) },
      });
      if (updated.count !== 1) {
        throw new ConflictException('当前版本已变化，重审结果未覆盖新版本状态');
      }
      await transaction.aiTask.update({
        where: { id: taskId },
        data: {
          status: AiTaskStatus.SUCCESS,
          outputSummary: `改写重审结果：${decision}`,
          durationMs: Date.now() - startedAt,
        },
      });
      return review;
    });
  }
}

function toReviewDecision(riskLevel: TextModerationResult['riskLevel']) {
  if (riskLevel === 'high') return SafetyReviewDecision.REJECT;
  if (riskLevel === 'medium') return SafetyReviewDecision.NEED_REWRITE;
  return SafetyReviewDecision.PASS;
}

function toRiskLevel(riskLevel: TextModerationResult['riskLevel']) {
  return {
    none: RiskLevel.NONE,
    low: RiskLevel.LOW,
    medium: RiskLevel.MEDIUM,
    high: RiskLevel.HIGH,
  }[riskLevel];
}

function toSafetyScore(riskLevel: TextModerationResult['riskLevel']) {
  return { none: 100, low: 80, medium: 50, high: 0 }[riskLevel];
}

function buildSafetyReviewData(
  contentId: string,
  contentVersionId: string,
  taskId: string,
  moderation: TextModerationResult,
) {
  return {
    contentId,
    contentVersionId,
    aiTaskId: taskId,
    decision: toReviewDecision(moderation.riskLevel),
    riskLevel: toRiskLevel(moderation.riskLevel),
    riskCategories: moderation.labels,
    riskSpans: moderation.riskSpans as unknown as Prisma.InputJsonValue,
    ruleHits: moderation.labels.includes('local_high_risk')
      ? (moderation.riskSpans as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    safetyScore: toSafetyScore(moderation.riskLevel),
    reason: moderation.reason,
    provider: moderation.provider,
    providerRequestId: moderation.requestId,
    rawProviderOutput: moderation.rawOutput as Prisma.InputJsonValue,
  };
}
