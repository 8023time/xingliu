import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUrl, IsUUID, MaxLength, ValidateIf } from 'class-validator';
import type { ModerationCheckRequest, ModerationSubjectType } from '@xingliu/shared/moderation';

const MODERATION_SUBJECT_TYPES: ModerationSubjectType[] = ['prompt', 'content', 'asset'];

export class ModerationCheckDto implements ModerationCheckRequest {
  @ApiProperty({
    description: '预检对象类型',
    enum: MODERATION_SUBJECT_TYPES,
    example: 'content',
  })
  @IsIn(['prompt', 'content', 'asset'])
  subjectType!: ModerationSubjectType;

  @ApiPropertyOptional({
    description: '预检对象 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({
    description: '待检测文本。text 与 assetUrl 至少提供一个',
    example: '需要进行安全预检的文本内容',
  })
  @ValidateIf((dto: ModerationCheckDto) => !dto.assetUrl)
  @IsString()
  @MaxLength(200000)
  text?: string;

  @ApiPropertyOptional({
    description: '待检测素材 URL。text 与 assetUrl 至少提供一个',
    example: 'https://example.com/image.png',
  })
  @ValidateIf((dto: ModerationCheckDto) => !dto.text)
  @IsUrl({ require_protocol: true })
  assetUrl?: string;
}
