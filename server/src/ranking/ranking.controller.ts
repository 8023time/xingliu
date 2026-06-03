import { Controller, Get, Query } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { RankingQueryDto } from './dto/ranking-query.dto';

@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('hot')
  findHot(@Query() query: RankingQueryDto): Promise<unknown> {
    return this.rankingService.findRanking('hot', query);
  }

  @Get('viral')
  findViral(@Query() query: RankingQueryDto): Promise<unknown> {
    return this.rankingService.findRanking('viral', query);
  }
}
