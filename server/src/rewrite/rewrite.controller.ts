import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@libs/common';
import { RewriteService } from './rewrite.service';
import { CreateRewriteDto } from './dto/create-rewrite.dto';
import { RewriteAcceptParamDto, RewriteContentParamDto } from './dto/rewrite-param.dto';

type AuthenticatedRequest = { user: { userId: string } };

@Controller('contents/:contentId/compliance-rewrite')
@UseGuards(AuthGuard)
export class RewriteController {
  constructor(private readonly rewriteService: RewriteService) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Param() params: RewriteContentParamDto,
    @Body() createRewriteDto: CreateRewriteDto,
  ) {
    return this.rewriteService.create(request.user.userId, params.contentId, createRewriteDto);
  }

  @Post(':rewriteId/accept')
  accept(@Req() request: AuthenticatedRequest, @Param() params: RewriteAcceptParamDto) {
    return this.rewriteService.accept(request.user.userId, params.contentId, params.rewriteId);
  }
}
