import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FileService, ModerationService, PrismaService, ResponseService } from '@libs/common';
import { Prisma } from '@libs/common/generated/prisma/client';
import {
  AiTaskStatus,
  AiTaskType,
  AssetType,
  ChangeType,
  ContentStatus,
  RiskLevel,
  SafetyReviewDecision,
  SafetyStatus,
} from '@libs/common/generated/prisma/enums';
import type { TextModerationResult } from '@libs/common';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ContentQueryDto } from './dto/content-query.dto';
import { ReviewContentDto } from './dto/review-content.dto';
import { QualityService } from '../quality/quality.service';
import { PublicFeedQueryDto } from './dto/public-feed-query.dto';

const contentSelect = {
  id: true,
  authorId: true,
  contentType: true,
  title: true,
  summary: true,
  coverAssetId: true,
  currentVersionId: true,
  publishedVersionId: true,
  status: true,
  safetyStatus: true,
  qualityLevel: true,
  qualityScore: true,
  safetyScore: true,
  publishedAt: true,
  offlineAt: true,
  createdAt: true,
  updatedAt: true,
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

const publicContentSelect = {
  id: true,
  contentType: true,
  qualityLevel: true,
  qualityScore: true,
  safetyScore: true,
  publishedAt: true,
  author: {
    select: { id: true, username: true, avatarUrl: true },
  },
  coverAsset: {
    select: { type: true, url: true, metadata: true },
  },
  publishedVersion: {
    select: {
      id: true,
      versionNo: true,
      title: true,
      summary: true,
      body: true,
      bodyJson: true,
      assetIds: true,
      coverAsset: { select: { type: true, url: true, metadata: true } },
      safetyReviews: {
        select: { safetyScore: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      qualityEvaluations: {
        select: { totalScore: true, level: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  },
  metrics: {
    select: { viewCount: true, likeCount: true, shareCount: true, collectCount: true },
  },
} as const;

@Injectable()
export class ContentService {
  constructor(
    private readonly moderationService: ModerationService,
    private readonly prismaService: PrismaService,
    private readonly qualityService: QualityService,
    private readonly responseService: ResponseService,
    private readonly fileService: FileService,
  ) {}

  async create(userId: string, createContentDto: CreateContentDto) {
    const content = await this.prismaService.content.create({
      data: {
        authorId: userId,
        contentType: createContentDto.contentType,
        title: createContentDto.title?.trim() ?? '',
      },
      select: contentSelect,
    });

    return this.responseService.success(content, '创建内容成功');
  }

  async findAll(userId: string, query: ContentQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = {
      authorId: userId,
      deletedAt: null,
      contentType: query.contentType,
      status: query.status,
    } satisfies Prisma.ContentWhereInput;

    const [items, total] = await Promise.all([
      this.prismaService.content.findMany({
        where,
        select: contentSelect,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prismaService.content.count({ where }),
    ]);

    return this.responseService.success(
      {
        page,
        pageSize,
        total,
        items,
      },
      '获取内容列表成功',
    );
  }

  async findOne(userId: string, id: string, message = '获取内容成功') {
    const content = await this.getOwnedContent(userId, id);
    return this.responseService.success(content, message);
  }

  async findVersions(userId: string, id: string) {
    await this.getOwnedContent(userId, id);
    const versions = await this.prismaService.contentVersion.findMany({
      where: { contentId: id },
      select: versionSelect,
      orderBy: { versionNo: 'desc' },
    });
    return this.responseService.success(versions, '获取正式版本成功');
  }

  async review(userId: string, id: string, dto: ReviewContentDto) {
    const version = await this.promoteDraft(userId, id, dto);
    const task = await this.prismaService.aiTask.create({
      data: {
        userId,
        contentId: id,
        taskType: AiTaskType.MODERATE,
        status: AiTaskStatus.RUNNING,
        modelProvider: 'aliyun_green',
        inputSummary: `审核内容版本 v${version.versionNo}`,
      },
      select: { id: true },
    });
    const startedAt = Date.now();

    let safetyReview: Awaited<ReturnType<ContentService['saveReviewResult']>>;
    try {
      const moderation = await this.moderationService.moderateText(
        [version.title, version.summary, version.body].filter(Boolean).join('\n'),
      );
      safetyReview = await this.saveReviewResult(id, version.id, task.id, moderation, startedAt);
    } catch (error) {
      await this.prismaService.aiTask.update({
        where: { id: task.id },
        data: {
          status: AiTaskStatus.FAILED,
          durationMs: Date.now() - startedAt,
          errorCode: 'MODERATION_FAILED',
          errorMessage: error instanceof Error ? error.message.slice(0, 500) : '内容审核失败',
        },
      });
      throw error;
    }

    const qualityEvaluation =
      safetyReview.decision === SafetyReviewDecision.PASS
        ? await this.qualityService.evaluate(userId, id, false)
        : null;
    return this.responseService.success({ safetyReview, qualityEvaluation }, '内容审核完成');
  }

  async publish(userId: string, id: string) {
    const context = await this.getPublishContext(userId, id);
    const task = await this.prismaService.aiTask.create({
      data: {
        userId,
        contentId: id,
        taskType: AiTaskType.MODERATE,
        status: AiTaskStatus.RUNNING,
        modelProvider: 'aliyun_green',
        inputSummary: `发布前复审内容版本 v${context.currentVersion.versionNo}`,
      },
      select: { id: true },
    });
    const startedAt = Date.now();

    try {
      const moderation = await this.moderationService.moderateText(
        [context.currentVersion.title, context.currentVersion.summary, context.currentVersion.body]
          .filter(Boolean)
          .join('\n'),
      );
      if (toReviewDecision(moderation.riskLevel) !== SafetyReviewDecision.PASS) {
        await this.saveFailedPublicationReview(id, context.currentVersion.id, task.id, moderation, startedAt);
        throw new BadRequestException('发布前复审未通过，内容禁止发布');
      }

      const published = await this.savePublication(id, context.currentVersion.id, task.id, moderation, startedAt);
      return this.responseService.success(published, '内容发布成功');
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
            errorCode: 'PUBLICATION_REVIEW_FAILED',
            errorMessage: error instanceof Error ? error.message.slice(0, 500) : '发布前复审失败',
          },
        });
      }
      throw error;
    }
  }

  async offline(userId: string, id: string) {
    await this.getOwnedContent(userId, id);
    const content = await this.prismaService.$transaction(async (transaction) => {
      return transaction.content.updateMany({
        where: { id, authorId: userId, deletedAt: null, publishedVersionId: { not: null } },
        data: {
          publishedVersionId: null,
          status: ContentStatus.OFFLINE,
          offlineAt: new Date(),
        },
      });
    });
    if (content.count !== 1) {
      throw new BadRequestException('内容当前未发布');
    }
    return this.findOne(userId, id, '内容已下线');
  }

  async findPublicFeed(query: PublicFeedQueryDto) {
    const limit = query.limit ?? 20;
    const contents = await this.prismaService.content.findMany({
      where: { publishedVersionId: { not: null }, deletedAt: null },
      select: publicContentSelect,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const hasMore = contents.length > limit;
    const items = (hasMore ? contents.slice(0, limit) : contents).map((content) => this.toPublicContent(content));
    return this.responseService.success(
      {
        items,
        nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
        hasMore,
      },
      '获取公开内容流成功',
    );
  }

  async findPublicContent(id: string) {
    const content = await this.prismaService.content.findFirst({
      where: { id, publishedVersionId: { not: null }, deletedAt: null },
      select: publicContentSelect,
    });
    if (!content) {
      throw new NotFoundException('公开内容不存在');
    }
    return this.responseService.success(this.toPublicContent(content), '获取公开内容成功');
  }

  async update(userId: string, id: string, updateContentDto: UpdateContentDto) {
    await this.getOwnedContent(userId, id);
    if (updateContentDto.coverAssetId) {
      const cover = await this.prismaService.asset.findFirst({
        where: { id: updateContentDto.coverAssetId, userId, deletedAt: null },
        select: { id: true },
      });
      if (!cover) {
        throw new BadRequestException('封面素材不存在或无权使用');
      }
    }

    const content = await this.prismaService.content.update({
      where: { id },
      data: updateContentDto,
      select: contentSelect,
    });

    return this.responseService.success(content, '更新内容成功');
  }

  async remove(userId: string, id: string) {
    await this.getOwnedContent(userId, id);
    await this.prismaService.content.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return this.responseService.success(null, '删除内容成功');
  }

  private async promoteDraft(userId: string, contentId: string, dto: ReviewContentDto) {
    try {
      return await this.prismaService.$transaction(async (transaction) => {
        const [content, draft, latestVersion] = await Promise.all([
          transaction.content.findFirst({
            where: { id: contentId, authorId: userId, deletedAt: null },
            select: { id: true, currentVersionId: true, coverAssetId: true },
          }),
          transaction.draftSnapshot.findFirst({
            where: { id: dto.draftSnapshotId, contentId, userId },
            select: {
              id: true,
              baseVersionId: true,
              title: true,
              summary: true,
              body: true,
              bodyJson: true,
              assetIds: true,
            },
          }),
          transaction.contentVersion.findFirst({
            where: { contentId },
            select: { versionNo: true },
            orderBy: { versionNo: 'desc' },
          }),
        ]);

        if (!content) throw new NotFoundException('内容不存在或无权操作');
        if (!draft) throw new NotFoundException('草稿快照不存在或无权提交');
        if (draft.baseVersionId !== content.currentVersionId) {
          throw new ConflictException('草稿基准版本已过期，请先处理冲突');
        }
        if (!draft.title.trim() || !draft.body.trim()) {
          throw new BadRequestException('正式版本标题和正文不能为空');
        }

        const version = await transaction.contentVersion.create({
          data: {
            contentId,
            versionNo: (latestVersion?.versionNo ?? 0) + 1,
            title: draft.title,
            summary: draft.summary,
            body: draft.body,
            bodyJson: draft.bodyJson ?? Prisma.JsonNull,
            assetIds: draft.assetIds ?? Prisma.JsonNull,
            coverAssetId: content.coverAssetId,
            changeType: content.currentVersionId ? ChangeType.EDIT : ChangeType.CREATE,
            changeSummary: dto.changeSummary?.trim() || undefined,
            createdBy: userId,
          },
          select: versionSelect,
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
        return version;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('内容版本已更新，请刷新后重新提交');
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
    const safetyScore = toSafetyScore(moderation.riskLevel);

    return this.prismaService.$transaction(async (transaction) => {
      const review = await transaction.safetyReview.create({
        data: {
          contentId,
          contentVersionId,
          aiTaskId: taskId,
          decision,
          riskLevel: toRiskLevel(moderation.riskLevel),
          riskCategories: moderation.labels,
          riskSpans: moderation.riskSpans,
          ruleHits: moderation.labels.includes('local_high_risk') ? moderation.riskSpans : Prisma.JsonNull,
          safetyScore,
          reason: moderation.reason,
          provider: moderation.labels.includes('local_high_risk') ? 'fastscan' : 'aliyun_green',
          providerRequestId: moderation.requestId,
          rawProviderOutput: moderation.rawOutput as Prisma.InputJsonValue,
        },
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
        data: { status, safetyStatus, safetyScore },
      });
      if (updated.count !== 1) {
        throw new ConflictException('当前版本已变化，审核结果未覆盖新版本状态');
      }
      await transaction.aiTask.update({
        where: { id: taskId },
        data: {
          status: AiTaskStatus.SUCCESS,
          outputSummary: `审核结果：${decision}`,
          durationMs: Date.now() - startedAt,
        },
      });
      return review;
    });
  }

  private async getPublishContext(userId: string, contentId: string) {
    const content = await this.prismaService.content.findFirst({
      where: { id: contentId, authorId: userId, deletedAt: null },
      select: {
        id: true,
        status: true,
        currentVersionId: true,
        safetyStatus: true,
        qualityScore: true,
        currentVersion: {
          select: { id: true, versionNo: true, title: true, summary: true, body: true },
        },
      },
    });
    if (!content?.currentVersionId || !content.currentVersion) {
      throw new NotFoundException('当前正式版本不存在或无权操作');
    }
    if (
      content.status !== ContentStatus.APPROVED ||
      content.safetyStatus !== SafetyStatus.PASS ||
      content.qualityScore === null
    ) {
      throw new BadRequestException('发布前必须完成当前版本安全审核和质量评分');
    }
    const [safetyReview, qualityEvaluation] = await Promise.all([
      this.prismaService.safetyReview.findFirst({
        where: { contentVersionId: content.currentVersionId, decision: SafetyReviewDecision.PASS },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.qualityEvaluation.findFirst({
        where: { contentVersionId: content.currentVersionId },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    if (!safetyReview || !qualityEvaluation) {
      throw new BadRequestException('当前版本缺少可发布的审核或评分结果');
    }
    return { currentVersion: content.currentVersion };
  }

  private savePublication(
    contentId: string,
    contentVersionId: string,
    taskId: string,
    moderation: TextModerationResult,
    startedAt: number,
  ) {
    return this.prismaService.$transaction(async (transaction) => {
      await transaction.safetyReview.create({
        data: buildSafetyReviewData(contentId, contentVersionId, taskId, moderation),
      });
      const publishedAt = new Date();
      const updated = await transaction.content.updateMany({
        where: {
          id: contentId,
          currentVersionId: contentVersionId,
          status: ContentStatus.APPROVED,
          safetyStatus: SafetyStatus.PASS,
          qualityScore: { not: null },
        },
        data: {
          publishedVersionId: contentVersionId,
          status: ContentStatus.PUBLISHED,
          publishedAt,
          offlineAt: null,
          safetyScore: toSafetyScore(moderation.riskLevel),
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException('当前版本状态已变化，发布已取消');
      }
      await transaction.contentMetric.upsert({
        where: { contentId },
        create: { contentId },
        update: {},
      });
      await transaction.aiTask.update({
        where: { id: taskId },
        data: {
          status: AiTaskStatus.SUCCESS,
          outputSummary: '发布前复审通过并完成发布',
          durationMs: Date.now() - startedAt,
        },
      });
      return { contentId, publishedVersionId: contentVersionId, publishedAt };
    });
  }

  private saveFailedPublicationReview(
    contentId: string,
    contentVersionId: string,
    taskId: string,
    moderation: TextModerationResult,
    startedAt: number,
  ) {
    const decision = toReviewDecision(moderation.riskLevel);
    return this.prismaService.$transaction([
      this.prismaService.safetyReview.create({
        data: buildSafetyReviewData(contentId, contentVersionId, taskId, moderation),
      }),
      this.prismaService.content.updateMany({
        where: { id: contentId, currentVersionId: contentVersionId },
        data: {
          status: decision === SafetyReviewDecision.NEED_REWRITE ? ContentStatus.NEED_REWRITE : ContentStatus.REJECTED,
          safetyStatus: SafetyStatus.REJECT,
          safetyScore: toSafetyScore(moderation.riskLevel),
        },
      }),
      this.prismaService.aiTask.update({
        where: { id: taskId },
        data: {
          status: AiTaskStatus.SUCCESS,
          outputSummary: `发布前复审结果：${decision}`,
          durationMs: Date.now() - startedAt,
        },
      }),
    ]);
  }

  private async getOwnedContent(userId: string, id: string) {
    const content = await this.prismaService.content.findFirst({
      where: { id, authorId: userId, deletedAt: null },
      select: contentSelect,
    });

    if (!content) {
      throw new NotFoundException('内容不存在或无权操作');
    }

    return content;
  }

  private toPublicContent(content: Parameters<typeof toPublicContent>[0]) {
    return toPublicContent(content, (asset) => this.getPublicAssetUrl(asset));
  }

  private getPublicAssetUrl(asset: { type: AssetType; url: string; metadata: unknown } | null) {
    if (!asset) {
      return null;
    }

    if (asset.type === AssetType.LINK || /^https?:\/\//i.test(asset.url)) {
      return asset.url;
    }

    const objectPath =
      asset.type === AssetType.IMAGE ? (getCompressedOutputStorageKey(asset.metadata) ?? asset.url) : asset.url;

    return this.fileService.getPublicUrl(objectPath);
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
    riskSpans: moderation.riskSpans,
    ruleHits: moderation.labels.includes('local_high_risk') ? moderation.riskSpans : Prisma.JsonNull,
    safetyScore: toSafetyScore(moderation.riskLevel),
    reason: moderation.reason,
    provider: moderation.labels.includes('local_high_risk') ? 'fastscan' : 'aliyun_green',
    providerRequestId: moderation.requestId,
    rawProviderOutput: moderation.rawOutput as Prisma.InputJsonValue,
  };
}

function toPublicContent(
  content: {
    id: string;
    contentType: unknown;
    qualityLevel: unknown;
    qualityScore: unknown;
    safetyScore: unknown;
    publishedAt: Date | null;
    author: { id: string; username: string; avatarUrl: string | null };
    coverAsset: { type: AssetType; url: string; metadata: unknown } | null;
    publishedVersion: {
      id: string;
      versionNo: number;
      title: string;
      summary: string | null;
      body: string;
      bodyJson: unknown;
      assetIds: unknown;
      coverAsset: { type: AssetType; url: string; metadata: unknown } | null;
      safetyReviews: Array<{ safetyScore: unknown }>;
      qualityEvaluations: Array<{ totalScore: unknown; level: unknown }>;
    } | null;
    metrics: { viewCount: number; likeCount: number; shareCount: number; collectCount: number } | null;
  },
  getPublicAssetUrl: (asset: { type: AssetType; url: string; metadata: unknown } | null) => string | null,
) {
  const version = content.publishedVersion;
  if (!version) {
    throw new ConflictException('公开内容缺少线上版本');
  }
  return {
    id: content.id,
    contentType: content.contentType,
    publishedAt: content.publishedAt,
    qualityLevel: version.qualityEvaluations[0]?.level ?? null,
    qualityScore: version.qualityEvaluations[0]?.totalScore ?? null,
    safetyScore: version.safetyReviews[0]?.safetyScore ?? null,
    coverUrl: getPublicAssetUrl(version.coverAsset ?? content.coverAsset),
    author: content.author,
    metrics: content.metrics ?? { viewCount: 0, likeCount: 0, shareCount: 0, collectCount: 0 },
    publishedVersion: version,
  };
}

function getCompressedOutputStorageKey(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const fileProcess = getObjectProperty(metadata, 'fileProcess');
  if (!fileProcess) {
    return null;
  }

  const processedOutputs = getArrayProperty(fileProcess, 'processedOutputs');
  if (!processedOutputs) {
    return null;
  }

  const compressedOutput = processedOutputs.find((output) => {
    return output && typeof output === 'object' && getStringProperty(output, 'variant') === 'compressed';
  });

  if (!compressedOutput || typeof compressedOutput !== 'object') {
    return null;
  }

  return getStringProperty(compressedOutput, 'storageKey');
}

function getObjectProperty(value: object, key: string): object | null {
  const property = (value as Record<string, unknown>)[key];
  return property && typeof property === 'object' && !Array.isArray(property) ? property : null;
}

function getArrayProperty(value: object, key: string): unknown[] | null {
  const property = (value as Record<string, unknown>)[key];
  return Array.isArray(property) ? property : null;
}

function getStringProperty(value: object, key: string): string | null {
  const property = (value as Record<string, unknown>)[key];
  return typeof property === 'string' ? property : null;
}
