import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FileService, PrismaService, ResponseService } from '@libs/common';
import { AssetType, InteractionType } from '@libs/common/generated/prisma/enums';
import type { ContentLikeStateResponse, ContentViewStateResponse } from '@xingliu/shared/content';
import { PublicFeedQueryDto } from './dto/public-feed-query.dto';

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
export class PublicContentService {
  constructor(
    private readonly fileService: FileService,
    private readonly prismaService: PrismaService,
    private readonly responseService: ResponseService,
  ) {}

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

  async findPublicContent(id: string, viewerId?: string | null) {
    const content = await this.prismaService.content.findFirst({
      where: { id, publishedVersionId: { not: null }, deletedAt: null },
      select: publicContentSelect,
    });
    if (!content) {
      throw new NotFoundException('公开内容不存在');
    }

    return this.responseService.success(
      {
        ...this.toPublicContent(content),
        viewer: {
          liked: viewerId ? await this.hasLiked(viewerId, id) : false,
        },
      },
      '获取公开内容成功',
    );
  }

  async view(contentId: string, viewerId?: string | null) {
    const result = await this.prismaService.$transaction(async (tx) => {
      const content = await tx.content.findFirst({
        where: { id: contentId, deletedAt: null, publishedVersionId: { not: null } },
        select: { id: true },
      });

      if (!content) throw new NotFoundException('公开内容不存在');

      if (viewerId) {
        await tx.contentInteraction.createMany({
          data: { userId: viewerId, contentId, actionType: InteractionType.VIEW },
          skipDuplicates: true,
        });
      }

      const metrics = await tx.contentMetric.upsert({
        where: { contentId },
        create: { contentId, viewCount: 1 },
        update: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      });

      return { contentId, viewCount: metrics.viewCount } satisfies ContentViewStateResponse;
    });

    return this.responseService.success(result, '记录浏览成功');
  }

  async like(userId: string, contentId: string) {
    const result = await this.prismaService.$transaction(async (tx) => {
      const content = await tx.content.findFirst({
        where: { id: contentId, deletedAt: null, publishedVersionId: { not: null } },
        select: { id: true },
      });

      if (!content) throw new NotFoundException('公开内容不存在');

      const created = await tx.contentInteraction.createMany({
        data: { userId, contentId, actionType: InteractionType.LIKE },
        skipDuplicates: true,
      });

      if (created.count > 0) {
        await tx.contentMetric.upsert({
          where: { contentId },
          create: { contentId, likeCount: 1 },
          update: { likeCount: { increment: 1 } },
        });
      }

      const metrics = await tx.contentMetric.findUnique({
        where: { contentId },
        select: { likeCount: true },
      });
      const liked = await tx.contentInteraction.findFirst({
        where: { userId, contentId, actionType: InteractionType.LIKE },
        select: { id: true },
      });

      return { contentId, liked: !!liked, likeCount: metrics?.likeCount ?? 0 } satisfies ContentLikeStateResponse;
    });

    return this.responseService.success(result, '点赞成功');
  }

  async unlike(userId: string, contentId: string) {
    const result = await this.prismaService.$transaction(async (tx) => {
      const content = await tx.content.findFirst({
        where: { id: contentId, deletedAt: null, publishedVersionId: { not: null } },
        select: { id: true },
      });

      if (!content) throw new NotFoundException('公开内容不存在');

      const deleted = await tx.contentInteraction.deleteMany({
        where: { userId, contentId, actionType: InteractionType.LIKE },
      });

      if (deleted.count > 0) {
        await tx.contentMetric.updateMany({
          where: { contentId, likeCount: { gt: 0 } },
          data: { likeCount: { decrement: 1 } },
        });
      }

      const metrics = await tx.contentMetric.findUnique({
        where: { contentId },
        select: { likeCount: true },
      });
      const liked = await tx.contentInteraction.findFirst({
        where: { userId, contentId, actionType: InteractionType.LIKE },
        select: { id: true },
      });

      return { contentId, liked: !!liked, likeCount: metrics?.likeCount ?? 0 } satisfies ContentLikeStateResponse;
    });

    return this.responseService.success(result, '取消点赞成功');
  }

  private toPublicContent(content: Parameters<typeof toPublicContent>[0]) {
    return toPublicContent(content, (asset) => this.getPublicAssetUrl(asset));
  }

  private async hasLiked(userId: string, contentId: string) {
    const interaction = await this.prismaService.contentInteraction.findFirst({
      where: { userId, contentId, actionType: InteractionType.LIKE },
      select: { id: true },
    });

    return !!interaction;
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
