import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthTokenPayloadType } from '@xingliu/shared/user';
import { AuthGuard } from '@libs/common';
import { DraftService } from './draft.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { DraftParamDto } from './dto/draft-param.dto';

type AuthenticatedRequest = Request & { user: AuthTokenPayloadType };

@Controller('contents/:contentId/drafts')
@UseGuards(AuthGuard)
export class DraftController {
  constructor(private readonly draftService: DraftService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Param() params: DraftParamDto, @Body() createDraftDto: CreateDraftDto) {
    return this.draftService.create(request.user.userId, params.contentId, createDraftDto);
  }

  @Get('latest')
  findLatest(@Req() request: AuthenticatedRequest, @Param() params: DraftParamDto) {
    return this.draftService.findLatest(request.user.userId, params.contentId);
  }

  @Post('sync')
  sync(@Req() request: AuthenticatedRequest, @Param() params: DraftParamDto, @Body() createDraftDto: CreateDraftDto) {
    return this.draftService.sync(request.user.userId, params.contentId, createDraftDto);
  }
}
