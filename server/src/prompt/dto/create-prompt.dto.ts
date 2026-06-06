import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { PromptInput } from '@xingliu/shared/prompt';

export class CreatePromptDto implements PromptInput {
  @ApiProperty({
    description: 'Prompt 名称',
    example: '深度文章结构生成',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Prompt 分类',
    example: '长文',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  category!: string;

  @ApiPropertyOptional({
    description: 'Prompt 说明',
    example: '适用于生成结构完整的深度文章',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Prompt 模板正文',
    example: '请围绕 {{topic}} 生成一篇结构完整的文章。',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  template!: string;

  @ApiPropertyOptional({
    description: '变量 Schema',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  variablesSchema?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: '模型配置',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  modelConfig?: Record<string, unknown>;
}
