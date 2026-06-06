import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@libs/common';
import { QualityService } from './quality.service';
import { QualityParamDto } from './dto/quality-param.dto';

type AuthenticatedRequest = { user: { userId: string } };

@Controller('contents/:contentId/quality-evaluation')
@UseGuards(AuthGuard)
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Post()
  evaluate(@Req() request: AuthenticatedRequest, @Param() params: QualityParamDto) {
    return this.qualityService.evaluate(request.user.userId, params.contentId);
  }
}
