import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { Prisma } from '@libs/common/generated/prisma/client';
import { AssetType, RiskLevel, SafetyStatus } from '@libs/common/generated/prisma/enums';
import {
  FileProcessService,
  MinioService,
  ModerationService,
  PrismaService,
  ResponseService,
  type FileProcessResult,
} from '@libs/common';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetQueryDto } from './dto/asset-query.dto';

interface UploadedAssetFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

interface StoredProcessedOutput {
  variant: string;
  storageKey: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  metadata: Record<string, unknown>;
}

const assetSelect = {
  id: true,
  userId: true,
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
    private readonly minioService: MinioService,
    private readonly moderationService: ModerationService,
    private readonly fileProcessService: FileProcessService,
  ) {}

  /**
   * 创建素材
   * 1. 判断是上传文件素材还是外部链接素材
   * 2. 上传文件到 MinIO，或直接创建 LINK 类型素材
   * 3. 创建完成后尝试执行素材审核
   */
  async create(userId: string, assetDto: CreateAssetDto, file?: UploadedAssetFile) {
    let asset: AssetEntity;

    if (file) {
      if (!this.minioService.isConfigured()) {
        throw new ServiceUnavailableException('MinIO 未配置，无法上传素材');
      }

      const processResult = await this.fileProcessService.process({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      });
      const extension = this.getStorageExtension(file.originalname, processResult);
      const objectName = `assets/${userId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;

      await this.minioService.uploadObject(objectName, file.buffer, processResult.metadata.mimeType as string);
      const processedOutputs = await this.uploadProcessedOutputs(objectName, processResult);
      const publicOutput = this.getPublicProcessedOutput(processedOutputs);
      const publicObjectName = publicOutput?.storageKey ?? objectName;

      asset = await this.prismaService.asset.create({
        data: {
          userId,
          type: this.getAssetType(processResult.category),
          name: assetDto.name,
          url: publicObjectName,
          storageKey: objectName,
          mimeType: publicOutput?.mimeType ?? (processResult.metadata.mimeType as string),
          sizeBytes: publicOutput?.size ?? file.size,
          tags: assetDto.tags,
          metadata: this.toAssetMetadata(processResult, processedOutputs),
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

  // 查找出所有素材
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

  // 找出指定的素材
  async findOne(userId: string, id: string) {
    const asset = await this.findOwnedAsset(userId, id);
    return this.responseService.success(this.toResponse(asset), '获取素材成功');
  }

  // 更新素材
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

  // 删除指定素材
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
    const { storageKey, url, ...rest } = asset;

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

    return this.minioService.getPublicUrl(this.getPublicObjectPath(asset));
  }

  private getOriginalAssetUrl(asset: AssetEntity) {
    if (asset.type === AssetType.LINK) {
      return asset.url;
    }

    return this.minioService.getPublicUrl(asset.storageKey);
  }

  private getPublicObjectPath(asset: AssetEntity) {
    if (asset.type === AssetType.IMAGE) {
      return this.getCompressedOutputStorageKey(asset.metadata) ?? asset.url;
    }

    return asset.url;
  }

  private getAssetType(category: FileProcessResult['category']): AssetType {
    if (category === 'image') return AssetType.IMAGE;
    if (category === 'video') return AssetType.VIDEO;
    if (category === 'audio') return AssetType.AUDIO;
    return AssetType.DOCUMENT;
  }

  private getStorageExtension(originalName: string, processResult: FileProcessResult) {
    if (processResult.detectedType?.ext) {
      return `.${processResult.detectedType.ext}`;
    }

    return extname(originalName).toLowerCase();
  }

  private async uploadProcessedOutputs(objectName: string, processResult: FileProcessResult) {
    const outputDirectory = objectName.slice(0, objectName.lastIndexOf('/'));
    const outputBaseName = objectName.slice(objectName.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '');

    const outputs: StoredProcessedOutput[] = [];

    for (const output of processResult.outputs) {
      const storageKey = `${outputDirectory}/${outputBaseName}.${output.filename}`;
      await this.minioService.uploadObject(storageKey, output.buffer, output.mimeType);
      outputs.push({
        variant: output.variant,
        storageKey,
        url: this.minioService.getPublicUrl(storageKey),
        filename: output.filename,
        mimeType: output.mimeType,
        size: output.size,
        metadata: output.metadata,
      });
    }

    return outputs;
  }

  private getPublicProcessedOutput(outputs: StoredProcessedOutput[]) {
    return outputs.find((output) => output.variant === 'compressed');
  }

  private getCompressedOutputStorageKey(metadata: unknown) {
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

  private toAssetMetadata(
    processResult: FileProcessResult,
    processedOutputs: StoredProcessedOutput[],
  ): Prisma.InputJsonValue {
    const metadata = {
      fileProcess: {
        category: processResult.category,
        detectedType: processResult.detectedType ?? null,
        metadata: this.toJsonRecord(processResult.metadata),
        processedOutputs,
      },
    };

    return metadata as unknown as Prisma.InputJsonValue;
  }

  private toJsonRecord(value: Record<string, unknown>): Record<string, Prisma.InputJsonValue> {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, item === undefined ? null : item]),
    ) as Record<string, Prisma.InputJsonValue>;
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
