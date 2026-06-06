import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@libs/common';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ContentQueryDto } from './dto/content-query.dto';
import { ReviewContentDto } from './dto/review-content.dto';
import { ContentParamDto } from './dto/content-param.dto';

type AuthenticatedRequest = { user: { userId: string } };

@Controller('contents')
@UseGuards(AuthGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() createContentDto: CreateContentDto) {
    return this.contentService.create(request.user.userId, createContentDto);
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest, @Query() query: ContentQueryDto) {
    return this.contentService.findAll(request.user.userId, query);
  }

  @Get(':id')
  findOne(@Req() request: AuthenticatedRequest, @Param() params: ContentParamDto) {
    return this.contentService.findOne(request.user.userId, params.id);
  }

  @Get(':id/versions')
  findVersions(@Req() request: AuthenticatedRequest, @Param() params: ContentParamDto) {
    return this.contentService.findVersions(request.user.userId, params.id);
  }

  @Post(':id/review')
  review(@Req() request: AuthenticatedRequest, @Param() params: ContentParamDto, @Body() dto: ReviewContentDto) {
    return this.contentService.review(request.user.userId, params.id, dto);
  }

  @Post(':id/publish')
  publish(@Req() request: AuthenticatedRequest, @Param() params: ContentParamDto) {
    return this.contentService.publish(request.user.userId, params.id);
  }

  @Post(':id/offline')
  offline(@Req() request: AuthenticatedRequest, @Param() params: ContentParamDto) {
    return this.contentService.offline(request.user.userId, params.id);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param() params: ContentParamDto,
    @Body() updateContentDto: UpdateContentDto,
  ) {
    return this.contentService.update(request.user.userId, params.id, updateContentDto);
  }

  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param() params: ContentParamDto) {
    return this.contentService.remove(request.user.userId, params.id);
  }
}
