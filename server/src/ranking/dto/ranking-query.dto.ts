import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const RANKING_SORT_VALUES = ['comprehensive', 'quality', 'heat', 'latest'] as const;
export type RankingSort = (typeof RANKING_SORT_VALUES)[number];

export class RankingQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsIn(RANKING_SORT_VALUES)
  sort?: RankingSort;
}
