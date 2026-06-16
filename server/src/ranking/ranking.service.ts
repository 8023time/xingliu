import { Injectable } from '@nestjs/common';
import { FileService, PrismaService, ResponseService } from '@libs/common';
import { AssetType } from '@libs/common/generated/prisma/enums';
import type { Prisma } from '@libs/common/generated/prisma/client';
import { RankingQueryDto, RankingSort } from './dto/ranking-query.dto';
import type { RankingKind, RankingAudience, RankingItem, RankingWeights } from './ranking.type';

// 质量分、热度分、新鲜度、互动反馈等因素的权重配置
const rankingWeights: Record<RankingKind, RankingWeights> = {
  hot: {
    quality: 0.3, // 质量分
    heat: 0.45, // 阅读热度
    freshness: 0.15, // 新鲜度
    interaction: 0.1, // 浏览互动（点赞、评论等）
  },
  viral: {
    quality: 0.25,
    heat: 0.5,
    freshness: 0.1,
    interaction: 0.15,
  },
};

const rankingContentInclude = {
  author: true,
  metrics: true,
  coverAsset: true,
  publishedVersion: {
    include: {
      coverAsset: true,
      qualityEvaluations: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  },
} satisfies Prisma.ContentInclude;

type RankingContent = Prisma.ContentGetPayload<{ include: typeof rankingContentInclude }>;

@Injectable()
export class RankingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseService: ResponseService,
    private readonly fileService: FileService,
  ) {}

  async findPublicHot(query: RankingQueryDto) {
    return this.findRanking('hot', query, 'public');
  }

  async findPublicViral(query: RankingQueryDto) {
    return this.findRanking('viral', query, 'public');
  }

  async findAdminHot(query: RankingQueryDto) {
    return this.findRanking('hot', query, 'admin');
  }

  async findAdminViral(query: RankingQueryDto) {
    return this.findRanking('viral', query, 'admin');
  }

  private async findRanking(kind: RankingKind, query: RankingQueryDto, audience: RankingAudience) {
    const limit = Math.min(Number(query.limit ?? 12), 50);
    const offset = parseCursor(query.cursor);
    const sort = query.sort ?? 'comprehensive';
    // 直接查询所有的已经发布的内容，在内存中计算排名和分页
    const contents = await this.findPublishedContents();
    const sortedItems = this.buildRankingItems(kind, contents).sort((left, right) =>
      compareRankingItems(left, right, sort),
    );
    const pageItems = sortedItems.slice(offset, offset + limit);
    const nextOffset = offset + pageItems.length;
    const hasMore = nextOffset < sortedItems.length;

    if (audience === 'public') {
      return this.responseService.success(
        {
          items: pageItems.map((item) => ({
            id: item.id,
            title: item.title,
            viewCount: item.viewCount,
            publishedAt: item.publishedAt,
          })),
          nextCursor: hasMore ? String(nextOffset) : null,
          hasMore,
          rankingType: kind,
          sort,
        },
        '获取榜单成功',
      );
    }

    return this.responseService.success(
      {
        items: pageItems,
        nextCursor: hasMore ? String(nextOffset) : null,
        hasMore,
        rankingType: kind,
        sort,
        weights: rankingWeights[kind],
      },
      '获取榜单成功',
    );
  }

  private findPublishedContents() {
    return this.prismaService.content.findMany({
      where: {
        publishedVersionId: { not: null },
        deletedAt: null,
      },
      include: rankingContentInclude,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: 500,
    });
  }

  private buildRankingItems(kind: RankingKind, contents: RankingContent[]) {
    const maxViewCount = Math.max(...contents.map((item) => item.metrics?.viewCount ?? 0), 1); // 找到最大阅读量，避免除以零
    const maxLikeCount = Math.max(...contents.map((item) => item.metrics?.likeCount ?? 0), 1); // 找到最大点赞量，避免除以零

    return contents.map((content) => {
      // ai 生成的内容质量分
      const qualityScore = toNumber(content.publishedVersion?.qualityEvaluations[0]?.totalScore);
      // 阅读热度: 单个文章的阅读量 / 最大阅读量
      const heatScore = normalize(content.metrics?.viewCount ?? 0, maxViewCount);
      // 互动反馈：单个文章的点赞量 / 最大点赞量
      const interactionScore = normalize(content.metrics?.likeCount ?? 0, maxLikeCount);
      // 新鲜度：根据发布时间衰减，发布时间越近分数越高，按照指数衰减计算，7天内的内容分数在 50 以上，30天以上的内容分数在 10 以下
      const freshnessScore = getFreshnessScore(content.publishedAt);
      const rankingScore = getRankingScore(
        {
          qualityScore,
          heatScore,
          freshnessScore,
          interactionScore,
        },
        rankingWeights[kind],
      );

      return {
        id: content.id,
        title: content.publishedVersion?.title ?? content.title,
        summary: content.publishedVersion?.summary ?? content.summary,
        contentType: content.contentType,
        authorName: content.author.username,
        qualityScore,
        heatScore,
        freshnessScore,
        interactionScore,
        rankingScore,
        viewCount: content.metrics?.viewCount ?? 0,
        likeCount: content.metrics?.likeCount ?? 0,
        shareCount: content.metrics?.shareCount ?? 0,
        collectCount: content.metrics?.collectCount ?? 0,
        publishedAt: content.publishedAt,
        // 排名理由
        reason: getReason(kind, qualityScore, heatScore, interactionScore, freshnessScore),
        coverUrl: this.getPublicAssetUrl(content.publishedVersion?.coverAsset ?? content.coverAsset),
      } satisfies RankingItem;
    });
  }

  private getPublicAssetUrl(asset: { type: AssetType; url: string; metadata: unknown } | null | undefined) {
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

function parseCursor(cursor?: string) {
  const offset = Number(cursor ?? 0);
  return Number.isFinite(offset) && offset > 0 ? offset : 0;
}

function toNumber(value: unknown) {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

function normalize(value: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Number(((value / max) * 100).toFixed(2));
}

function getFreshnessScore(publishedAt: Date | null) {
  if (!publishedAt) {
    return 0;
  }

  const ageHours = Math.max((Date.now() - publishedAt.getTime()) / 36e5, 0);
  return Number((100 * Math.exp(-ageHours / 168)).toFixed(2));
}

function getRankingScore(
  factors: {
    qualityScore: number;
    heatScore: number;
    freshnessScore: number;
    interactionScore: number;
  },
  weights: RankingWeights,
) {
  const score =
    factors.qualityScore * weights.quality +
    factors.heatScore * weights.heat +
    factors.freshnessScore * weights.freshness +
    factors.interactionScore * weights.interaction;

  return Number(score.toFixed(2));
}

function compareRankingItems(left: RankingItem, right: RankingItem, sort: RankingSort) {
  const sortValueMap = {
    comprehensive: [right.rankingScore - left.rankingScore, right.qualityScore - left.qualityScore],
    quality: [right.qualityScore - left.qualityScore, right.rankingScore - left.rankingScore],
    heat: [right.heatScore - left.heatScore, right.rankingScore - left.rankingScore],
    latest: [
      new Date(right.publishedAt ?? 0).getTime() - new Date(left.publishedAt ?? 0).getTime(),
      right.rankingScore - left.rankingScore,
    ],
  };

  const [primary, secondary] = sortValueMap[sort];
  return primary || secondary || right.id.localeCompare(left.id);
}

function getReason(
  kind: RankingKind,
  qualityScore: number,
  heatScore: number,
  interactionScore: number,
  freshnessScore: number,
) {
  const labels = [
    { label: '质量分突出', value: qualityScore },
    { label: '阅读热度高', value: heatScore },
    { label: '点赞反馈好', value: interactionScore },
    { label: '发布时间较新', value: freshnessScore },
  ]
    .sort((left, right) => right.value - left.value)
    .slice(0, 2)
    .map((item) => item.label);

  return `${kind === 'hot' ? '热点榜' : '爆文榜'}综合排序：${labels.join('、')}`;
}
