import {
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import * as Minio from 'minio';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
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

  /**
   * 模块初始化时
   * 1. 检查 MinIO 是否已配置
   * 2. 如果已配置，检查桶是否存在，不存在则创建并设置公共读取权限
   */
  async onModuleInit() {
    if (!this.isConfigured()) {
      this.logger.warn('MinIO 环境变量配置不完整，服务将处于不可用状态。');
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
        this.logger.log(`MinIO 自动创建了桶 [${bucketName}] 并配置了公开可读权限。`);
      } else {
        this.logger.log(`MinIO 桶 [${bucketName}] 初始化检查成功。`);
      }
    } catch (error) {
      // 捕获异常，防止因存储服务连不上导致整个 NestJS 进程崩溃
      this.logger.error(`MinIO 桶 [${bucketName}] 初始化失败，请检查网络或配置:`, error);
    }
  }

  /**
   * 上传对象到 MinIO（支持 Buffer 或 Stream 流，全面防爆内存）
   * @param objectName 对象名称（包含路径）
   * @param content 对象内容（支持 Buffer 或 Readable 流）
   * @param mimeType 对象的 MIME 类型
   * @param size 文件大小（如果是 Stream 流，建议传入准确大小；如果是 Buffer 可不传）
   */
  public async uploadObject(
    objectName: string,
    content: Buffer | Readable,
    mimeType: string,
    size?: number,
  ): Promise<void> {
    try {
      const uploadSize = content instanceof Buffer ? content.length : (size ?? -1);

      await this.getClient().putObject(this.getBucketName(), objectName, content, uploadSize, {
        'Content-Type': mimeType,
      });
    } catch (error) {
      this.logger.error(`文件上传失败 [${objectName}]:`, error);
      throw new InternalServerErrorException('文件上传存储失败');
    }
  }

  /**
   * 从 MinIO 删除对象
   * @param objectName 对象名称（包含路径）
   */
  public async removeObject(objectName: string): Promise<void> {
    try {
      await this.getClient().removeObject(this.getBucketName(), objectName);
    } catch (error) {
      this.logger.error(`文件删除失败 [${objectName}]:`, error);
      throw new InternalServerErrorException('文件删除失败');
    }
  }

  /**
   * 从 MinIO 获取文件的可读流（下载/读取文件）
   * @param objectName 对象名称（包含路径）
   * @returns {Promise<Readable>} 返回 Node.js 可读流
   */
  public async getObject(objectName: string): Promise<Readable> {
    try {
      // 调用底层 getClient() 并直接传回 MinIO 的文件流
      return await this.getClient().getObject(this.getBucketName(), objectName);
    } catch (error) {
      this.logger.error(`获取文件流失败 [${objectName}]:`, error);
      throw new InternalServerErrorException('无法读取或下载该文件');
    }
  }

  /**
   * 获取对象的公共 URL
   * @param objectName 对象名称（包含路径）
   * @return {string} 对象的公共 URL
   */
  public getPublicUrl(objectName: string): string {
    const configuredBaseUrl = this.configService.get<string>('MINIO_PUBLIC_URL')?.replace(/\/+$/, '');
    const encodedPath = objectName
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    // 如果配置了 CDN 或自定义域名，直接优先返回
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

  /**
   * 检查 MinIO 是否已正确配置
   * @returns {boolean} 如果 MinIO 已配置返回 true，否则返回 false
   */
  public isConfigured(): boolean {
    return Boolean(
      this.configService.get<string>('MINIO_ENDPOINT') &&
      this.configService.get<string>('MINIO_ACCESS_KEY') &&
      this.configService.get<string>('MINIO_SECRET_KEY') &&
      this.configService.get<string>('MINIO_BUCKET_NAME'),
    );
  }

  /**
   * 获取 MinIO 客户端实例
   * @returns {Minio.Client} MinIO 客户端实例
   * @throws {ServiceUnavailableException} 如果 MinIO 未配置或不可用，则抛出异常
   */
  private getClient(): Minio.Client {
    if (!this.minioClient) {
      throw new ServiceUnavailableException('MinIO 文件存储服务未配置或不可用');
    }
    return this.minioClient;
  }

  /**
   * 获取桶名称
   * @returns {string} 桶名称
   */
  private getBucketName(): string {
    return this.configService.get<string>('MINIO_BUCKET_NAME')!;
  }
}
