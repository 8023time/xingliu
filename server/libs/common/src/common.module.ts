import { Module, Global } from '@nestjs/common';
import { CommonService } from './common.service';
import { PrismaModule } from './prisma/prisma.module';
import { ResponseModule } from './response/response.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MinioModule } from './minio/minio.module';

@Global()
@Module({
  providers: [CommonService],
  exports: [CommonService, PrismaModule, ResponseModule, JwtModule, ConfigModule, MinioModule],
  imports: [
    PrismaModule,
    ResponseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          global: true,
          secret: configService.get<string>('SECRET_KEY'),
          signOptions: { expiresIn: '7d' },
        };
      },
    }),
    MinioModule,
  ],
})
export class CommonModule {}
