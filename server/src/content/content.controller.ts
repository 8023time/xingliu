import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@libs/common';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ContentQueryDto } from './dto/content-query.dto';
import { ReviewContentDto } from './dto/review-content.dto';
import { ContentParamDto } from './dto/content-param.dto';
import type { Request } from 'express';

/**
 * 内容管理接口，包含内容的创建、查询、更新、删除、审核、发布等功能
 * 主要是面向内容创作者和管理员使用，提供对内容的全生命周期管理
 */
@Controller('contents')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  /**
   * 创建内容
   */
  @Post()
  @UseGuards(AuthGuard)
  create(@Req() request: Request, @Body() createContentDto: CreateContentDto) {
    return this.contentService.create(request.user.userId, createContentDto);
  }

  /**
   * 查询内容列表
   */
  @Get()
  @UseGuards(AuthGuard)
  findAll(@Req() request: Request, @Query() query: ContentQueryDto) {
    return this.contentService.findAll(request.user.userId, query);
  }

  /**
   * 查询内容详情
   */
  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Req() request: Request, @Param() params: ContentParamDto) {
    return this.contentService.findOne(request.user.userId, params.id);
  }

  /**
   * 查询内容版本列表
   */
  @Get(':id/versions')
  @UseGuards(AuthGuard)
  findVersions(@Req() request: Request, @Param() params: ContentParamDto) {
    return this.contentService.findVersions(request.user.userId, params.id);
  }

  /**
   * 审核内容
   */
  @Post(':id/review')
  @UseGuards(AuthGuard)
  review(@Req() request: Request, @Param() params: ContentParamDto, @Body() dto: ReviewContentDto) {
    return this.contentService.review(request.user.userId, params.id, dto);
  }

  /**
   * 发布内容
   */
  @Post(':id/publish')
  @UseGuards(AuthGuard)
  publish(@Req() request: Request, @Param() params: ContentParamDto) {
    return this.contentService.publish(request.user.userId, params.id);
  }

  /**
   * 下线内容
   */
  @Post(':id/offline')
  @UseGuards(AuthGuard)
  offline(@Req() request: Request, @Param() params: ContentParamDto) {
    return this.contentService.offline(request.user.userId, params.id);
  }

  /**
   * 更新内容
   */
  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Req() request: Request, @Param() params: ContentParamDto, @Body() updateContentDto: UpdateContentDto) {
    return this.contentService.update(request.user.userId, params.id, updateContentDto);
  }

  /**
   * 删除内容
   */
  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Req() request: Request, @Param() params: ContentParamDto) {
    return this.contentService.remove(request.user.userId, params.id);
  }
}
