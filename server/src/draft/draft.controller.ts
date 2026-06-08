import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '@libs/common';
import { DraftService } from './draft.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { DraftParamDto } from './dto/draft-param.dto';

@Controller('contents/:contentId/drafts')
export class DraftController {
  constructor(private readonly draftService: DraftService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() request: Request, @Param() params: DraftParamDto, @Body() createDraftDto: CreateDraftDto) {
    return this.draftService.create(request.user.userId, params.contentId, createDraftDto);
  }

  @Get('latest')
  @UseGuards(AuthGuard)
  findLatest(@Req() request: Request, @Param() params: DraftParamDto) {
    return this.draftService.findLatest(request.user.userId, params.contentId);
  }

  @Post('sync')
  @UseGuards(AuthGuard)
  sync(@Req() request: Request, @Param() params: DraftParamDto, @Body() createDraftDto: CreateDraftDto) {
    return this.draftService.sync(request.user.userId, params.contentId, createDraftDto);
  }
}
