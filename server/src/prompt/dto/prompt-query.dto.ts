import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { PromptQueryRequest } from '@xingliu/shared/prompt';

export class PromptQueryDto implements PromptQueryRequest {
  @ApiPropertyOptional({
    description: '页码',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: '每页数量，最大 50',
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'Prompt 分类',
    example: '长文',
  })
  @IsOptional()
  @IsString()
  category?: string;
}
