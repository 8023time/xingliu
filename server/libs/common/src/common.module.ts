import { Module, Global } from '@nestjs/common';
import { CommonService } from './common.service';
import { PrismaModule } from './prisma/prisma.module';
import { ResponseModule } from './response/response.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AiModule } from './ai/ai.module';
import { ModerationModule } from './moderation/moderation.module';
import { FileModule } from './file/file.module';

@Global()
@Module({
  providers: [CommonService],
  exports: [
    CommonService,
    PrismaModule,
    ResponseModule,
    JwtModule,
    ConfigModule,
    AiModule,
    ModerationModule,
    FileModule,
  ],
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
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: '7d' },
        };
      },
    }),
    AiModule,
    ModerationModule,
    FileModule,
  ],
})
export class CommonModule {}
