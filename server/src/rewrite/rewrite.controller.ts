import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@libs/common';
import { RewriteService } from './rewrite.service';
import { CreateRewriteDto } from './dto/create-rewrite.dto';
import { RewriteAcceptParamDto, RewriteContentParamDto } from './dto/rewrite-param.dto';
import type { Request } from 'express';

@Controller('contents/:contentId/compliance-rewrite')
export class RewriteController {
  constructor(private readonly rewriteService: RewriteService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() request: Request, @Param() params: RewriteContentParamDto, @Body() createRewriteDto: CreateRewriteDto) {
    return this.rewriteService.create(request.user.userId, params.contentId, createRewriteDto);
  }

  @Post(':rewriteId/accept')
  @UseGuards(AuthGuard)
  accept(@Req() request: Request, @Param() params: RewriteAcceptParamDto) {
    return this.rewriteService.accept(request.user.userId, params.contentId, params.rewriteId);
  }
}
