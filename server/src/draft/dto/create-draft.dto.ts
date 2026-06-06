import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { DraftSavedFrom } from '@libs/common/generated/prisma/enums';
import type { DraftInput } from '@xingliu/shared/content';

export class CreateDraftDto implements DraftInput {
  @ApiProperty({
    description: '草稿标题',
    example: 'AI 创作者如何提升图文生产效率',
  })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: '草稿摘要',
    example: '面向创作者的 AI 内容生产效率指南',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @ApiProperty({
    description: '草稿正文',
    example: '<p>正文内容</p>',
  })
  @IsString()
  @MaxLength(200000)
  body!: string;

  @ApiPropertyOptional({
    description: 'Tiptap JSON 正文',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  bodyJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: '关联素材 ID 列表',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID(undefined, { each: true })
  assetIds?: string[];

  @ApiPropertyOptional({
    description: '基准版本 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  baseVersionId?: string;

  @ApiProperty({
    description: '客户端修订号',
    example: 1,
  })
  @IsInt()
  @Min(1)
  clientRevision!: number;

  @ApiProperty({
    description: '服务端修订号',
    example: 0,
  })
  @IsInt()
  @Min(0)
  serverRevision!: number;

  @ApiPropertyOptional({
    description: '保存来源',
    enum: DraftSavedFrom,
    example: DraftSavedFrom.MANUAL,
  })
  @IsOptional()
  @IsEnum(DraftSavedFrom)
  savedFrom?: DraftInput['savedFrom'];
}
