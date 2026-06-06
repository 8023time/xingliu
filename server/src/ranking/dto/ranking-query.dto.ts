import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { RankingQueryRequest, RankingSortValue } from '@xingliu/shared/content/ranking';

export const RANKING_SORT_VALUES: RankingSortValue[] = ['comprehensive', 'quality', 'heat', 'latest'];
export type RankingSort = RankingSortValue;

export class RankingQueryDto implements RankingQueryRequest {
  @ApiPropertyOptional({
    description: '游标',
    example: '20',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: '每页数量，最大 50',
    example: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    description: '排序方式',
    enum: RANKING_SORT_VALUES,
    example: 'comprehensive',
  })
  @IsOptional()
  @IsIn(RANKING_SORT_VALUES)
  sort?: RankingSort;
}
