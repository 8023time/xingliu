import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from '@libs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { PromptModule } from './prompt/prompt.module';
import { AssetModule } from './asset/asset.module';
import { QualityModule } from './quality/quality.module';
import { RewriteModule } from './rewrite/rewrite.module';
import { RankingModule } from './ranking/ranking.module';
import { DraftModule } from './draft/draft.module';
import { AiGenerationModule } from './ai-generation/ai-generation.module';
import { ContentModule } from './content/content.module';

@Module({
  imports: [
    CommonModule,
    UserModule,
    AuthModule,
    PromptModule,
    AssetModule,
    QualityModule,
    RewriteModule,
    RankingModule,
    DraftModule,
    AiGenerationModule,
    ContentModule,
  ],
  controllers: [AppController],
  providers: [AppService, AuthService],
})
export class AppModule {}
