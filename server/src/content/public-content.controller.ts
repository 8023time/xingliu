import { Controller, Get, Param, Query } from '@nestjs/common';
import { ContentService } from './content.service';
import { PublicFeedQueryDto } from './dto/public-feed-query.dto';
import { ContentParamDto } from './dto/content-param.dto';

@Controller()
export class PublicContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('feed')
  findFeed(@Query() query: PublicFeedQueryDto) {
    return this.contentService.findPublicFeed(query);
  }

  @Get('public/contents/:id')
  findPublicContent(@Param() params: ContentParamDto) {
    return this.contentService.findPublicContent(params.id);
  }
}
