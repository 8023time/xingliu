import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ContentType } from '@libs/common/generated/prisma/enums';
import type { CreateContentRequest } from '@xingliu/shared/content';

export class CreateContentDto implements CreateContentRequest {
  @ApiProperty({
    description: '内容类型',
    enum: ContentType,
    example: ContentType.ARTICLE,
  })
  @IsEnum(ContentType)
  contentType!: CreateContentRequest['contentType'];

  @ApiPropertyOptional({
    description: '内容标题',
    example: 'AI 创作者如何提升图文生产效率',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
