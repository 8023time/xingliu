import { Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import type { AuthTokenPayload } from '@xingliu/shared/user';
import { AuthGuard, PrismaService } from '@libs/common';
import { PublicContentService } from './public-content.service';
import { PublicFeedQueryDto } from './dto/public-feed-query.dto';
import { ContentParamDto } from './dto/content-param.dto';
import type { Request } from 'express';
import { ContentLikeDto, ContentLikeStateDto } from './dto/content-like.dto';
import { ContentUnlikeDto } from './dto/content-unlike.dto';
import { ContentViewDto, ContentViewStateDto } from './dto/content-view.dto';

/**
 * 公共内容接口，包含内容的公开查询、点赞等功能
 * 主要是面向普通用户使用，提供对公开内容的访问和互动功能
 * 与ContentController区分开来，ContentController主要面向内容创作者和管理员，提供内容的全生命周期管理功能
 * PublicContentController则面向所有用户，提供对公开内容的访问和互动功能
 */
@Controller()
export class PublicContentController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly publicContentService: PublicContentService,
  ) {}

  /**
   * 查询内容推荐列表，包含分页和过滤功能，主要用于首页推荐和内容发现页
   */
  @Get('feed')
  findFeed(@Query() query: PublicFeedQueryDto) {
    return this.publicContentService.findPublicFeed(query);
  }

  /**
   * 查询公开内容详情
   */
  @Get('public/contents/:id')
  async findPublicContent(@Req() request: Request, @Param() params: ContentParamDto) {
    return this.publicContentService.findPublicContent(params.id, await this.getOptionalViewerId(request));
  }

  /**
   * 记录内容浏览
   */
  @Post('public/contents/:contentId/view')
  @ApiOkResponse({ type: ContentViewStateDto })
  async view(@Req() request: Request, @Param() params: ContentViewDto) {
    return this.publicContentService.view(params.contentId, await this.getOptionalViewerId(request));
  }

  /**
   * 点赞内容
   */
  @Post('public/contents/:contentId/like')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ContentLikeStateDto })
  like(@Req() request: Request, @Param() params: ContentLikeDto) {
    return this.publicContentService.like(request.user.userId, params.contentId);
  }

  /**
   * 取消点赞内容
   */
  @Delete('public/contents/:contentId/like')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ContentLikeStateDto })
  unlike(@Req() request: Request, @Param() params: ContentUnlikeDto) {
    return this.publicContentService.unlike(request.user.userId, params.contentId);
  }

  private async getOptionalViewerId(request: Request) {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }

    try {
      const payload = this.jwtService.verify<AuthTokenPayload>(authorization.replace('Bearer ', ''));
      if (payload.tokenType !== 'access') {
        return null;
      }

      const user = await this.prismaService.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, tokenVersion: true },
      });

      if (!user || user.tokenVersion !== payload.tokenVersion) {
        return null;
      }

      return user.id;
    } catch {
      return null;
    }
  }
}
