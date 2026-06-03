import { Module } from '@nestjs/common';
import { RewriteService } from './rewrite.service';
import { RewriteController } from './rewrite.controller';

@Module({
  controllers: [RewriteController],
  providers: [RewriteService],
})
export class RewriteModule {}
