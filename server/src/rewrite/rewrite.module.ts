import { Module } from '@nestjs/common';
import { RewriteService } from './rewrite.service';
import { RewriteController } from './rewrite.controller';
import { QualityModule } from '../quality/quality.module';

@Module({
  imports: [QualityModule],
  controllers: [RewriteController],
  providers: [RewriteService],
})
export class RewriteModule {}
