import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;

  constructor(private configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT')!,
      port: this.configService.get<number>('MINIO_PORT'),
      useSSL: this.configService.get<boolean>('MINIO_USE_SSL'),
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY'),
    });
  }

  async onModuleInit() {
    const bucketName = this.configService.get<string>('MINIO_BUCKET_NAME')!;
    const exists = await this.minioClient.bucketExists(bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(bucketName);
      await this.minioClient.setBucketPolicy(
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
    }
  }

  /**
   * 获取客户端
   */
  getClient(): Minio.Client {
    return this.minioClient;
  }

  /**
   * 获取桶名称
   */
  getBucketName(): string {
    return this.configService.get<string>('MINIO_BUCKET_NAME')!;
  }
}
