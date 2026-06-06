import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import type { UpdateContentRequest } from '@xingliu/shared/content';

export class UpdateContentDto implements UpdateContentRequest {
  @ApiPropertyOptional({
    description: '内容标题',
    example: 'AI 创作者如何提升图文生产效率',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: '内容摘要',
    example: '面向创作者的 AI 内容生产效率指南',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @ApiPropertyOptional({
    description: '封面素材 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  coverAssetId?: string;
}
