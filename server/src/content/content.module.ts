import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { QualityModule } from '../quality/quality.module';
import { PublicContentController } from './public-content.controller';
import { PublicContentService } from './public-content.service';

@Module({
  imports: [QualityModule],
  controllers: [ContentController, PublicContentController],
  providers: [ContentService, PublicContentService],
})
export class ContentModule {}
