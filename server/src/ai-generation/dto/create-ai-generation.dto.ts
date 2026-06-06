import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import type { AiGenerateInput } from '@xingliu/shared/ai';

export class CreateAiGenerationDto implements AiGenerateInput {
  @ApiProperty({
    description: '内容 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  contentId!: string;

  @ApiProperty({
    description: '生成主题',
    example: 'AI 创作者如何提升图文生产效率',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  topic!: string;

  @ApiProperty({
    description: 'Prompt 模板 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  promptId!: string;

  @ApiPropertyOptional({
    description: '可引用的素材 ID 列表',
    example: ['550e8400-e29b-41d4-a716-446655440002'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID(undefined, { each: true })
  assetIds?: string[];

  @ApiPropertyOptional({
    description: '目标受众',
    example: '内容运营负责人',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  audience?: string;

  @ApiPropertyOptional({
    description: '写作风格',
    example: '专业、清晰、适合小红书图文',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  style?: string;

  @ApiPropertyOptional({
    description: '关键词列表',
    example: ['AI 创作', '内容分发'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  keywords?: string[];
}
