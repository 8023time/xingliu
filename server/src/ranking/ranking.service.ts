import { Injectable } from '@nestjs/common';
import { MinioService, PrismaService, ResponseService } from '@libs/common';
import { AssetType } from '@libs/common/generated/prisma/enums';
import { RankingQueryDto, RankingSort } from './dto/ranking-query.dto';

type RankingKind = 'hot' | 'viral';

interface RankingWeights {
  quality: number;
  heat: number;
  freshness: number;
  interaction: number;
}

interface RankingItem {
  id: string;
  title: string;
  summary: string | null;
  contentType: string;
  authorName: string;
  qualityScore: number;
  heatScore: number;
  freshnessScore: number;
  interactionScore: number;
  rankingScore: number;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  collectCount: number;
  publishedAt: Date | string | null;
  reason: string;
  coverUrl: string | null;
}

const rankingWeights: Record<RankingKind, RankingWeights> = {
  hot: {
    quality: 0.35,
    heat: 0.45,
    freshness: 0.2,
    interaction: 0,
  },
  viral: {
    quality: 0.35,
    heat: 0.55,
    freshness: 0.1,
    interaction: 0,
  },
};

@Injectable()
export class RankingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseService: ResponseService,
    private readonly minioService: MinioService,
  ) {}

  async findRanking(kind: RankingKind, query: RankingQueryDto) {
    const limit = Math.min(Number(query.limit ?? 12), 50);
    const offset = parseCursor(query.cursor);
    const sort = query.sort ?? 'comprehensive';
    const weights = rankingWeights[kind];

    const contents = await this.prismaService.content.findMany({
      where: {
        publishedVersionId: { not: null },
        deletedAt: null,
      },
      include: {
        author: true,
        metrics: true,
        coverAsset: true,
        publishedVersion: {
          include: {
            coverAsset: true,
            qualityEvaluations: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: 500,
    });

    const maxViewCount = Math.max(...contents.map((item) => item.metrics?.viewCount ?? 0), 1);
    const maxInteractionCount = Math.max(...contents.map((item) => getInteractionCount(item.metrics)), 1);

    const sortedItems = contents
      .map((content) => {
        const qualityScore = toNumber(content.publishedVersion?.qualityEvaluations[0]?.totalScore);
        const heatScore = normalize(content.metrics?.viewCount ?? 0, maxViewCount);
        const interactionScore = normalize(getInteractionCount(content.metrics), maxInteractionCount);
        const freshnessScore = getFreshnessScore(content.publishedAt);
        const rankingScore = getRankingScore(
          {
            qualityScore,
            heatScore,
            freshnessScore,
            interactionScore,
          },
          weights,
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
          reason: getReason(kind, qualityScore, heatScore, freshnessScore),
          coverUrl: this.getPublicAssetUrl(content.publishedVersion?.coverAsset ?? content.coverAsset),
        } satisfies RankingItem;
      })
      .sort((left, right) => compareRankingItems(left, right, sort));

    const pageItems = sortedItems.slice(offset, offset + limit);
    const nextOffset = offset + pageItems.length;

    return this.responseService.success(
      {
        items: pageItems,
        nextCursor: nextOffset < sortedItems.length ? String(nextOffset) : null,
        hasMore: nextOffset < sortedItems.length,
        rankingType: kind,
        sort,
        weights,
      },
      '获取榜单成功',
    );
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

    return this.minioService.getPublicUrl(objectPath);
  }
}

function getCompressedOutputStorageKey(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object' || !('fileProcess' in metadata)) {
    return null;
  }

  const fileProcess = metadata.fileProcess;
  if (!fileProcess || typeof fileProcess !== 'object' || !('processedOutputs' in fileProcess)) {
    return null;
  }

  const processedOutputs = fileProcess.processedOutputs;
  if (!Array.isArray(processedOutputs)) {
    return null;
  }

  const compressedOutput = processedOutputs.find((output) => {
    return output && typeof output === 'object' && 'variant' in output && output.variant === 'compressed';
  });

  if (!compressedOutput || typeof compressedOutput !== 'object' || !('storageKey' in compressedOutput)) {
    return null;
  }

  return typeof compressedOutput.storageKey === 'string' ? compressedOutput.storageKey : null;
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

function getInteractionCount(
  metrics: {
    likeCount: number;
    shareCount: number;
    collectCount: number;
  } | null,
) {
  if (!metrics) {
    return 0;
  }

  return metrics.likeCount * 2 + metrics.shareCount * 3 + metrics.collectCount * 2;
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

function getReason(kind: RankingKind, qualityScore: number, heatScore: number, freshnessScore: number) {
  const labels = [
    { label: '质量分突出', value: qualityScore },
    { label: '阅读热度高', value: heatScore },
    { label: '发布时间较新', value: freshnessScore },
  ]
    .sort((left, right) => right.value - left.value)
    .slice(0, 2)
    .map((item) => item.label);

  return `${kind === 'hot' ? '热点榜' : '爆文榜'}综合排序：${labels.join('、')}`;
}
