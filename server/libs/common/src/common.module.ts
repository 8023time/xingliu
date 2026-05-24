import { Module, Global } from '@nestjs/common';
import { CommonService } from './common.service';
import { PrismaModule } from './prisma/prisma.module';
import { ResponseModule } from './response/response.module';

@Global()
@Module({
  providers: [CommonService],
  exports: [CommonService, PrismaModule, ResponseModule],
  imports: [PrismaModule, ResponseModule],
})
export class CommonModule {}
