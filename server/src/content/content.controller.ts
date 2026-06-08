import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@libs/common';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ContentQueryDto } from './dto/content-query.dto';
import { ReviewContentDto } from './dto/review-content.dto';
import { ContentParamDto } from './dto/content-param.dto';
import type { Request } from 'express';

@Controller('contents')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() request: Request, @Body() createContentDto: CreateContentDto) {
    return this.contentService.create(request.user.userId, createContentDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll(@Req() request: Request, @Query() query: ContentQueryDto) {
    return this.contentService.findAll(request.user.userId, query);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Req() request: Request, @Param() params: ContentParamDto) {
    return this.contentService.findOne(request.user.userId, params.id);
  }

  @Get(':id/versions')
  @UseGuards(AuthGuard)
  findVersions(@Req() request: Request, @Param() params: ContentParamDto) {
    return this.contentService.findVersions(request.user.userId, params.id);
  }

  @Post(':id/review')
  @UseGuards(AuthGuard)
  review(@Req() request: Request, @Param() params: ContentParamDto, @Body() dto: ReviewContentDto) {
    return this.contentService.review(request.user.userId, params.id, dto);
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard)
  publish(@Req() request: Request, @Param() params: ContentParamDto) {
    return this.contentService.publish(request.user.userId, params.id);
  }

  @Post(':id/offline')
  @UseGuards(AuthGuard)
  offline(@Req() request: Request, @Param() params: ContentParamDto) {
    return this.contentService.offline(request.user.userId, params.id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Req() request: Request, @Param() params: ContentParamDto, @Body() updateContentDto: UpdateContentDto) {
    return this.contentService.update(request.user.userId, params.id, updateContentDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Req() request: Request, @Param() params: ContentParamDto) {
    return this.contentService.remove(request.user.userId, params.id);
  }
}
