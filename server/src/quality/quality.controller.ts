import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@libs/common';
import { QualityService } from './quality.service';
import { QualityParamDto } from './dto/quality-param.dto';
import type { Request } from 'express';

@Controller('contents/:contentId/quality-evaluation')
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Post()
  @UseGuards(AuthGuard)
  evaluate(@Req() request: Request, @Param() params: QualityParamDto) {
    return this.qualityService.evaluate(request.user.userId, params.contentId);
  }
}
