import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { PublicFeedQueryRequest } from '@xingliu/shared/content';

export class PublicFeedQueryDto implements PublicFeedQueryRequest {
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
}
