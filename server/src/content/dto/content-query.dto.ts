import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ContentStatus, ContentType } from '@libs/common/generated/prisma/enums';
import type { ContentQueryRequest } from '@xingliu/shared/content';

export class ContentQueryDto implements ContentQueryRequest {
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
    description: '内容类型',
    enum: ContentType,
    example: ContentType.ARTICLE,
  })
  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentQueryRequest['contentType'];

  @ApiPropertyOptional({
    description: '内容状态',
    enum: ContentStatus,
    example: ContentStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentQueryRequest['status'];
}
