import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { Prisma } from '../generated/prisma/client';
import { CommonStatus, FileCategory, FileObjectPurpose } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { FileInterface } from './interface/File.interface';
import { FileProcessService } from './processors/file-process.service';
import { MinioStorageService } from './storage/minio-storage.service';
import type {
  FileProcessCategory,
  FileProcessResult,
  FileRecord,
  FileUploadInput,
  FileUploadOptions,
  StoredProcessedOutput,
} from './types';

const fileObjectSelect = {
  id: true,
  userId: true,
  purpose: true,
  category: true,
  originalName: true,
  storageKey: true,
  publicStorageKey: true,
  mimeType: true,
  sizeBytes: true,
  checksum: true,
  metadata: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

type FileObjectEntity = Prisma.FileObjectGetPayload<{
  select: typeof fileObjectSelect;
}>;

@Injectable()
export class FileService extends FileInterface {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storage: MinioStorageService,
    private readonly fileProcessService: FileProcessService,
  ) {
    super();
  }

  async upload(file: FileUploadInput, userId: string, options: FileUploadOptions = {}): Promise<FileRecord> {
    if (!this.storage.isConfigured()) {
      throw new ServiceUnavailableException('File storage is not configured');
    }
    if (!file.buffer.length) {
      throw new BadRequestException('Uploaded file is empty');
    }

    const maxSizeBytes = options.maxSizeBytes ?? this.getDefaultMaxSizeBytes(options.purpose);
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(`File size cannot exceed ${Math.floor(maxSizeBytes / 1024 / 1024)} MB`);
    }

    const processResult = await this.fileProcessService.process(
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
      { image: options.imageProcessOptions },
    );
    const category = this.toFileCategory(processResult.category);
    const allowedCategories = options.allowedCategories;
    if (allowedCategories?.length && !allowedCategories.includes(category)) {
      throw new BadRequestException('File category is not allowed');
    }

    const purpose = options.purpose ?? FileObjectPurpose.TEMP;
    const extension = this.getStorageExtension(file.originalname, processResult);
    const storageKey = `files/${purpose.toLowerCase()}/${userId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;
    const mimeType = getStringProperty(processResult.metadata, 'mimeType') ?? file.mimetype;

    await this.storage.uploadObject(storageKey, file.buffer, mimeType);
    const processedOutputs = await this.uploadProcessedOutputs(storageKey, processResult);
    const publicOutput = processedOutputs.find((output) => output.variant === 'compressed');
    const publicStorageKey = publicOutput?.storageKey ?? null;

    const fileObject = await this.prismaService.fileObject.create({
      data: {
        userId,
        purpose,
        category,
        originalName: file.originalname,
        storageKey,
        publicStorageKey,
        mimeType: publicOutput?.mimeType ?? mimeType,
        sizeBytes: publicOutput?.size ?? file.size,
        checksum: this.getSha256(file.buffer),
        metadata: this.toFileMetadata(processResult, processedOutputs),
      },
      select: fileObjectSelect,
    });

    return this.toRecord(fileObject);
  }

  async findOne(fileId: string, userId: string): Promise<FileRecord> {
    const fileObject = await this.findOwnedEntity(fileId, userId);
    return this.toRecord(fileObject);
  }

  async remove(fileId: string, userId: string): Promise<void> {
    const fileObject = await this.findOwnedEntity(fileId, userId);

    await this.prismaService.fileObject.update({
      where: { id: fileId },
      data: {
        status: CommonStatus.DELETED,
        deletedAt: new Date(),
      },
    });

    const objectKeys = [fileObject.storageKey, ...this.getProcessedOutputStorageKeys(fileObject.metadata)];
    for (const objectKey of new Set(objectKeys)) {
      await this.storage.removeObject(objectKey);
    }
  }

  getPublicUrl(storageKey: string): string {
    return this.storage.getPublicUrl(storageKey);
  }

  private async findOwnedEntity(fileId: string, userId: string): Promise<FileObjectEntity> {
    const fileObject = await this.prismaService.fileObject.findFirst({
      where: {
        id: fileId,
        userId,
        deletedAt: null,
      },
      select: fileObjectSelect,
    });

    if (!fileObject) {
      throw new NotFoundException('File does not exist or cannot be accessed');
    }

    return fileObject;
  }

  private getDefaultMaxSizeBytes(purpose?: FileObjectPurpose) {
    if (purpose === FileObjectPurpose.AVATAR) {
      return 5 * 1024 * 1024;
    }

    return 20 * 1024 * 1024;
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
      await this.storage.uploadObject(storageKey, output.buffer, output.mimeType);
      outputs.push({
        variant: output.variant,
        storageKey,
        url: this.storage.getPublicUrl(storageKey),
        filename: output.filename,
        mimeType: output.mimeType,
        size: output.size,
        metadata: output.metadata,
      });
    }

    return outputs;
  }

  private toRecord(fileObject: FileObjectEntity): FileRecord {
    const objectPath = fileObject.publicStorageKey ?? fileObject.storageKey;

    return {
      id: fileObject.id,
      purpose: fileObject.purpose,
      category: fileObject.category,
      originalName: fileObject.originalName,
      objectPath,
      originalObjectPath: fileObject.storageKey,
      url: this.storage.getPublicUrl(objectPath),
      originalUrl: this.storage.getPublicUrl(fileObject.storageKey),
      mimeType: fileObject.mimeType,
      sizeBytes: fileObject.sizeBytes,
      metadata: this.toRecordMetadata(fileObject.metadata),
      status: fileObject.status,
      createdAt: fileObject.createdAt,
      updatedAt: fileObject.updatedAt,
    };
  }

  private toFileCategory(category: FileProcessCategory): FileCategory {
    const map: Record<FileProcessCategory, FileCategory> = {
      image: FileCategory.IMAGE,
      video: FileCategory.VIDEO,
      audio: FileCategory.AUDIO,
      document: FileCategory.DOCUMENT,
      unknown: FileCategory.UNKNOWN,
    };

    return map[category];
  }

  private toFileMetadata(
    processResult: FileProcessResult,
    processedOutputs: StoredProcessedOutput[],
  ): Prisma.InputJsonValue {
    return {
      fileProcess: {
        category: processResult.category,
        detectedType: processResult.detectedType
          ? {
              ext: processResult.detectedType.ext,
              mime: processResult.detectedType.mime,
            }
          : null,
        metadata: this.toJsonRecord(processResult.metadata),
        processedOutputs: processedOutputs.map((output) => ({
          variant: output.variant,
          storageKey: output.storageKey,
          url: output.url,
          filename: output.filename,
          mimeType: output.mimeType,
          size: output.size,
          metadata: this.toJsonRecord(output.metadata),
        })),
      },
    };
  }

  private toJsonRecord(value: Record<string, unknown>): Record<string, Prisma.InputJsonValue> {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, item === undefined ? null : item]),
    ) as Record<string, Prisma.InputJsonValue>;
  }

  private toRecordMetadata(value: Prisma.JsonValue | null): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value;
  }

  private getProcessedOutputStorageKeys(metadata: unknown) {
    if (!metadata || typeof metadata !== 'object') {
      return [];
    }

    const fileProcess = getObjectProperty(metadata, 'fileProcess');
    if (!fileProcess) {
      return [];
    }

    const processedOutputs = getArrayProperty(fileProcess, 'processedOutputs');
    if (!processedOutputs) {
      return [];
    }

    return processedOutputs
      .map((output) => {
        if (!output || typeof output !== 'object') {
          return null;
        }

        return getStringProperty(output, 'storageKey');
      })
      .filter((storageKey): storageKey is string => Boolean(storageKey));
  }

  private getSha256(buffer: Buffer) {
    return createHash('sha256').update(buffer).digest('hex');
  }
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
