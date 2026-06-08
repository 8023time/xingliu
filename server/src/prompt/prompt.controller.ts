import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '@libs/common';
import { PromptService } from './prompt.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { PromptQueryDto } from './dto/prompt-query.dto';
import { PromptParamDto } from './dto/prompt-param.dto';

@Controller('prompts')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() request: Request, @Body() createPromptDto: CreatePromptDto) {
    return this.promptService.create(request.user.userId, createPromptDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll(@Req() request: Request, @Query() query: PromptQueryDto) {
    return this.promptService.findAll(request.user.userId, query);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Req() request: Request, @Param() params: PromptParamDto) {
    return this.promptService.findOne(request.user.userId, params.id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Req() request: Request, @Param() params: PromptParamDto, @Body() updatePromptDto: UpdatePromptDto) {
    return this.promptService.update(request.user.userId, params.id, updatePromptDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Req() request: Request, @Param() params: PromptParamDto) {
    return this.promptService.remove(request.user.userId, params.id);
  }
}
