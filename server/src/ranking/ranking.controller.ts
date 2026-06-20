import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@libs/common';
import { RankingService } from './ranking.service';
import { RankingQueryDto } from './dto/ranking-query.dto';

@Controller()
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('rankings/hot')
  findPublicHot(@Query() query: RankingQueryDto): Promise<unknown> {
    return this.rankingService.findPublicHot(query);
  }

  @Get('rankings/viral')
  findPublicViral(@Query() query: RankingQueryDto): Promise<unknown> {
    return this.rankingService.findPublicViral(query);
  }

  @Get('ranking/hot')
  @UseGuards(AuthGuard)
  findCreatorHot(@Query() query: RankingQueryDto): Promise<unknown> {
    return this.rankingService.findCreatorHot(query);
  }

  @Get('ranking/viral')
  @UseGuards(AuthGuard)
  findCreatorViral(@Query() query: RankingQueryDto): Promise<unknown> {
    return this.rankingService.findCreatorViral(query);
  }
}
