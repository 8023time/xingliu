import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import type { Readable } from 'node:stream';
import type { FileStorage } from './interface/file-storage.interface';

@Injectable()
export class MinioStorageService implements FileStorage, OnModuleInit {
  private readonly logger = new Logger(MinioStorageService.name);
  private readonly minioClient: Minio.Client | null;

  constructor(private readonly configService: ConfigService) {
    this.minioClient = this.isConfigured()
      ? new Minio.Client({
          endPoint: this.configService.get<string>('MINIO_ENDPOINT')!,
          port: this.configService.get<number>('MINIO_PORT'),
          useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
          accessKey: this.configService.get<string>('MINIO_ACCESS_KEY'),
          secretKey: this.configService.get<string>('MINIO_SECRET_KEY'),
        })
      : null;
  }

  async onModuleInit() {
    if (!this.isConfigured()) {
      this.logger.warn('MinIO 环境变量配置不完整，文件存储服务将处于不可用状态。');
      return;
    }

    const bucketName = this.getBucketName();
    try {
      const client = this.getClient();
      const exists = await client.bucketExists(bucketName);

      if (!exists) {
        await client.makeBucket(bucketName);
        await client.setBucketPolicy(
          bucketName,
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicRead',
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${bucketName}/*`],
              },
            ],
          }),
        );
        this.logger.log(`MinIO 自动创建桶 [${bucketName}] 并配置公开读取权限。`);
      } else {
        this.logger.log(`MinIO 桶 [${bucketName}] 初始化检查成功。`);
      }
    } catch (error) {
      this.logger.error(`MinIO 桶 [${bucketName}] 初始化失败，请检查网络或配置。`, error);
    }
  }

  async uploadObject(objectName: string, content: Buffer | Readable, mimeType: string, size?: number): Promise<void> {
    try {
      const uploadSize = content instanceof Buffer ? content.length : (size ?? -1);

      await this.getClient().putObject(this.getBucketName(), objectName, content, uploadSize, {
        'Content-Type': mimeType,
      });
    } catch (error) {
      this.logger.error(`文件上传失败 [${objectName}]。`, error);
      throw new InternalServerErrorException('文件上传存储失败');
    }
  }

  async removeObject(objectName: string): Promise<void> {
    try {
      await this.getClient().removeObject(this.getBucketName(), objectName);
    } catch (error) {
      this.logger.error(`文件删除失败 [${objectName}]。`, error);
      throw new InternalServerErrorException('文件删除失败');
    }
  }

  async getObject(objectName: string): Promise<Readable> {
    try {
      return await this.getClient().getObject(this.getBucketName(), objectName);
    } catch (error) {
      this.logger.error(`获取文件流失败 [${objectName}]。`, error);
      throw new InternalServerErrorException('无法读取或下载该文件');
    }
  }

  getPublicUrl(objectName: string): string {
    const configuredBaseUrl = this.configService.get<string>('MINIO_PUBLIC_URL')?.replace(/\/+$/, '');
    const encodedPath = objectName
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    if (configuredBaseUrl) {
      return `${configuredBaseUrl}/${encodedPath}`;
    }

    const endpoint = this.configService.get<string>('MINIO_ENDPOINT')!;
    const port = this.configService.get<number>('MINIO_PORT');
    const isSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';

    const protocol = isSSL ? 'https' : 'http';
    const portSegment = port ? `:${port}` : '';

    return `${protocol}://${endpoint}${portSegment}/${this.getBucketName()}/${encodedPath}`;
  }

  isConfigured(): boolean {
    return Boolean(
      this.configService.get<string>('MINIO_ENDPOINT') &&
      this.configService.get<string>('MINIO_ACCESS_KEY') &&
      this.configService.get<string>('MINIO_SECRET_KEY') &&
      this.configService.get<string>('MINIO_BUCKET_NAME'),
    );
  }

  private getClient(): Minio.Client {
    if (!this.minioClient) {
      throw new ServiceUnavailableException('MinIO 文件存储服务未配置或不可用');
    }
    return this.minioClient;
  }

  private getBucketName(): string {
    return this.configService.get<string>('MINIO_BUCKET_NAME')!;
  }
}
