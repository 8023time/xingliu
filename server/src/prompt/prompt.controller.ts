import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthTokenPayloadType } from '@xingliu/shared/user';
import { AuthGuard } from '@libs/common';
import { PromptService } from './prompt.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { PromptQueryDto } from './dto/prompt-query.dto';
import { PromptParamDto } from './dto/prompt-param.dto';

type AuthenticatedRequest = Request & { user: AuthTokenPayloadType };

@Controller('prompts')
@UseGuards(AuthGuard)
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() createPromptDto: CreatePromptDto) {
    return this.promptService.create(request.user.userId, createPromptDto);
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest, @Query() query: PromptQueryDto) {
    return this.promptService.findAll(request.user.userId, query);
  }

  @Get(':id')
  findOne(@Req() request: AuthenticatedRequest, @Param() params: PromptParamDto) {
    return this.promptService.findOne(request.user.userId, params.id);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param() params: PromptParamDto,
    @Body() updatePromptDto: UpdatePromptDto,
  ) {
    return this.promptService.update(request.user.userId, params.id, updatePromptDto);
  }

  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param() params: PromptParamDto) {
    return this.promptService.remove(request.user.userId, params.id);
  }
}
