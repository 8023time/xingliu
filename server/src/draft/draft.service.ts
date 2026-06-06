import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@libs/common/generated/prisma/client';
import { DraftSavedFrom, DraftSyncStatus } from '@libs/common/generated/prisma/enums';
import { PrismaService, ResponseService } from '@libs/common';
import { CreateDraftDto } from './dto/create-draft.dto';

const draftSelect = {
  id: true,
  contentId: true,
  userId: true,
  baseVersionId: true,
  title: true,
  summary: true,
  body: true,
  bodyJson: true,
  assetIds: true,
  clientRevision: true,
  serverRevision: true,
  syncStatus: true,
  savedFrom: true,
  createdAt: true,
} as const;

@Injectable()
export class DraftService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseService: ResponseService,
  ) {}

  create(userId: string, contentId: string, createDraftDto: CreateDraftDto) {
    return this.save(userId, contentId, createDraftDto, createDraftDto.savedFrom ?? DraftSavedFrom.AUTO);
  }

  async findLatest(userId: string, contentId: string) {
    await this.assertOwnedContent(userId, contentId);
    const draft = await this.getLatestDraft(contentId);
    return this.responseService.success(draft, draft ? '获取最新云端草稿成功' : '暂无云端草稿');
  }

  sync(userId: string, contentId: string, createDraftDto: CreateDraftDto) {
    return this.save(userId, contentId, createDraftDto, DraftSavedFrom.OFFLINE_SYNC);
  }

  private async save(userId: string, contentId: string, dto: CreateDraftDto, savedFrom: DraftSavedFrom) {
    const content = await this.assertOwnedContent(userId, contentId);
    await this.assertDraftReferences(userId, contentId, dto);
    const latest = await this.getLatestDraft(contentId);

    if (
      (latest?.serverRevision ?? 0) !== dto.serverRevision ||
      content.currentVersionId !== (dto.baseVersionId ?? null)
    ) {
      this.throwConflict(latest, content.currentVersionId);
    }
    if (latest && dto.clientRevision <= latest.clientRevision) {
      throw new BadRequestException('clientRevision 必须大于最新云端草稿修订号');
    }

    try {
      const draft = await this.prismaService.$transaction(async (transaction) => {
        const snapshot = await transaction.draftSnapshot.create({
          data: {
            contentId,
            userId,
            title: dto.title,
            summary: dto.summary,
            body: dto.body,
            bodyJson: dto.bodyJson as Prisma.InputJsonValue | undefined,
            assetIds: dto.assetIds,
            baseVersionId: dto.baseVersionId,
            clientRevision: dto.clientRevision,
            serverRevision: dto.serverRevision + 1,
            syncStatus: DraftSyncStatus.SYNCED,
            savedFrom,
          },
          select: draftSelect,
        });

        await transaction.content.update({
          where: { id: contentId },
          data: { title: dto.title, summary: dto.summary },
        });

        return snapshot;
      });

      return this.responseService.success(
        draft,
        savedFrom === DraftSavedFrom.OFFLINE_SYNC ? '离线草稿同步成功' : '云端草稿保存成功',
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        this.throwConflict(await this.getLatestDraft(contentId), content.currentVersionId);
      }
      throw error;
    }
  }

  private async assertOwnedContent(userId: string, contentId: string) {
    const content = await this.prismaService.content.findFirst({
      where: { id: contentId, authorId: userId, deletedAt: null },
      select: { id: true, currentVersionId: true },
    });
    if (!content) {
      throw new NotFoundException('内容不存在或无权操作');
    }
    return content;
  }

  private async assertDraftReferences(userId: string, contentId: string, dto: CreateDraftDto) {
    if (dto.baseVersionId) {
      const version = await this.prismaService.contentVersion.findFirst({
        where: { id: dto.baseVersionId, contentId },
        select: { id: true },
      });
      if (!version) {
        throw new BadRequestException('草稿基准版本不属于当前内容');
      }
    }

    if (dto.assetIds?.length) {
      const assetCount = await this.prismaService.asset.count({
        where: { id: { in: dto.assetIds }, userId, deletedAt: null },
      });
      if (assetCount !== new Set(dto.assetIds).size) {
        throw new BadRequestException('草稿包含不存在或无权使用的素材');
      }
    }
  }

  private getLatestDraft(contentId: string) {
    return this.prismaService.draftSnapshot.findFirst({
      where: { contentId },
      select: draftSelect,
      orderBy: [{ serverRevision: 'desc' }, { createdAt: 'desc' }],
    });
  }

  private throwConflict(
    latest: Awaited<ReturnType<DraftService['getLatestDraft']>>,
    currentVersionId: string | null,
  ): never {
    throw new ConflictException({
      message: '云端草稿或基准版本已更新，请先处理冲突',
      conflict: {
        cloudDraft: latest,
        currentVersionId,
      },
    });
  }
}
