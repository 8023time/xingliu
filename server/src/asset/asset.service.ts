import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@libs/common/generated/prisma/client';
import {
  AssetType,
  FileCategory,
  FileObjectPurpose,
  RiskLevel,
  SafetyStatus,
} from '@libs/common/generated/prisma/enums';
import { FileService, ModerationService, PrismaService, ResponseService, type FileRecord } from '@libs/common';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetQueryDto } from './dto/asset-query.dto';

interface UploadedAssetFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const assetSelect = {
  id: true,
  userId: true,
  fileObjectId: true,
  type: true,
  name: true,
  url: true,
  storageKey: true,
  mimeType: true,
  sizeBytes: true,
  tags: true,
  aiDescription: true,
  metadata: true,
  safetyStatus: true,
  safetyRiskLevel: true,
  safetyLabels: true,
  safetyReason: true,
  safetyCheckedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type AssetEntity = Prisma.AssetGetPayload<{
  select: typeof assetSelect;
}>;

@Injectable()
export class AssetService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseService: ResponseService,
    private readonly moderationService: ModerationService,
    private readonly fileService: FileService,
  ) {}

  async create(userId: string, assetDto: CreateAssetDto, file?: UploadedAssetFile) {
    let asset: AssetEntity;

    if (file) {
      const uploadedFile = await this.fileService.upload(file, userId, {
        purpose: FileObjectPurpose.ASSET,
      });

      asset = await this.prismaService.asset.create({
        data: {
          userId,
          fileObjectId: uploadedFile.id,
          type: this.getAssetType(uploadedFile.category),
          name: assetDto.name,
          url: uploadedFile.objectPath,
          storageKey: uploadedFile.originalObjectPath,
          mimeType: uploadedFile.mimeType,
          sizeBytes: uploadedFile.sizeBytes,
          tags: assetDto.tags,
          metadata: uploadedFile.metadata as Prisma.InputJsonValue,
        },
        select: assetSelect,
      });
    } else {
      if (assetDto.type !== AssetType.LINK || !assetDto.url) {
        throw new BadRequestException('未上传文件时，必须提供 LINK 类型和有效链接');
      }

      asset = await this.prismaService.asset.create({
        data: {
          userId,
          type: AssetType.LINK,
          name: assetDto.name,
          url: assetDto.url,
          storageKey: `external:${randomUUID()}`,
          tags: assetDto.tags,
        },
        select: assetSelect,
      });
    }

    await this.tryModerate(asset);

    return this.responseService.success(this.toResponse(asset), '创建素材成功');
  }

  async findAll(userId: string, query: AssetQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = {
      userId,
      deletedAt: null,
      type: query.type,
      safetyStatus: query.safetyStatus,
    } satisfies Prisma.AssetWhereInput;

    const [assets, total] = await Promise.all([
      this.prismaService.asset.findMany({
        where,
        select: assetSelect,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prismaService.asset.count({ where }),
    ]);

    return this.responseService.success(
      {
        page,
        pageSize,
        total,
        items: assets.map((item) => this.toResponse(item)),
      },
      '获取素材列表成功',
    );
  }

  async findOne(userId: string, id: string) {
    const asset = await this.findOwnedAsset(userId, id);
    return this.responseService.success(this.toResponse(asset), '获取素材成功');
  }

  async update(userId: string, id: string, dto: UpdateAssetDto) {
    await this.findOwnedAsset(userId, id);

    const asset = await this.prismaService.asset.update({
      where: { id },
      data: {
        name: dto.name,
        tags: dto.tags,
      },
      select: assetSelect,
    });

    return this.responseService.success(this.toResponse(asset), '更新素材成功');
  }

  async remove(userId: string, id: string) {
    await this.findOwnedAsset(userId, id);

    await this.prismaService.asset.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return this.responseService.success(null, '删除素材成功');
  }

  async moderate(userId: string, id: string) {
    const asset = await this.findOwnedAsset(userId, id);

    await this.prismaService.asset.update({
      where: { id },
      data: {
        safetyStatus: SafetyStatus.PENDING,
        safetyRiskLevel: null,
        safetyLabels: Prisma.DbNull,
        safetyReason: null,
        safetyRawOutput: Prisma.DbNull,
        safetyCheckedAt: null,
      },
    });

    await this.moderateImageAsset(asset);

    const latestAsset = await this.findOwnedAsset(userId, id);

    return this.responseService.success(this.toResponse(latestAsset), '素材审核完成');
  }

  private async findOwnedAsset(userId: string, id: string): Promise<AssetEntity> {
    const asset = await this.prismaService.asset.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: assetSelect,
    });

    if (!asset) {
      throw new NotFoundException('素材不存在或无权操作');
    }

    return asset;
  }

  private async tryModerate(asset: AssetEntity) {
    try {
      await this.moderateImageAsset(asset);
    } catch (error) {
      await this.prismaService.asset.update({
        where: { id: asset.id },
        data: {
          safetyStatus: SafetyStatus.PENDING,
          safetyReason: error instanceof Error ? error.message : '素材审核待重试',
        },
      });
    }
  }

  private async moderateImageAsset(asset: AssetEntity) {
    if (asset.type !== AssetType.IMAGE) {
      throw new ServiceUnavailableException('当前仅支持图片素材自动审核');
    }

    const imageUrl = this.getOriginalAssetUrl(asset);
    const result = await this.moderationService.moderateImage(imageUrl);

    await this.prismaService.asset.update({
      where: { id: asset.id },
      data: {
        safetyStatus:
          result.riskLevel === 'none' || result.riskLevel === 'low' ? SafetyStatus.PASS : SafetyStatus.REJECT,
        safetyRiskLevel: this.toRiskLevel(result.riskLevel),
        safetyLabels: result.labels,
        safetyReason: result.reason,
        safetyRawOutput: result.rawOutput as Prisma.InputJsonValue,
        safetyCheckedAt: new Date(),
      },
    });
  }

  private toResponse(asset: AssetEntity) {
    const { storageKey, ...rest } = asset;

    return {
      ...rest,
      objectPath: asset.type === AssetType.LINK ? null : this.getPublicObjectPath(asset),
      originalObjectPath: asset.type === AssetType.LINK ? null : storageKey,
      url: this.getAssetUrl(asset),
    };
  }

  private getAssetUrl(asset: AssetEntity) {
    if (asset.type === AssetType.LINK) {
      return asset.url;
    }

    return this.fileService.getPublicUrl(this.getPublicObjectPath(asset));
  }

  private getOriginalAssetUrl(asset: AssetEntity) {
    if (asset.type === AssetType.LINK) {
      return asset.url;
    }

    return this.fileService.getPublicUrl(asset.storageKey);
  }

  private getPublicObjectPath(asset: AssetEntity) {
    return asset.url;
  }

  private getAssetType(category: FileRecord['category']): AssetType {
    if (category === FileCategory.IMAGE) return AssetType.IMAGE;
    if (category === FileCategory.VIDEO) return AssetType.VIDEO;
    if (category === FileCategory.AUDIO) return AssetType.AUDIO;
    return AssetType.DOCUMENT;
  }

  private toRiskLevel(riskLevel: 'none' | 'low' | 'medium' | 'high'): RiskLevel {
    const map: Record<typeof riskLevel, RiskLevel> = {
      none: RiskLevel.NONE,
      low: RiskLevel.LOW,
      medium: RiskLevel.MEDIUM,
      high: RiskLevel.HIGH,
    };

    return map[riskLevel];
  }
}
