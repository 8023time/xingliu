import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import type { ReviewContentRequest } from '@xingliu/shared/content';

export class ReviewContentDto implements ReviewContentRequest {
  @ApiProperty({
    description: '草稿快照 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  draftSnapshotId!: string;

  @ApiPropertyOptional({
    description: '本次提交审核的变更说明',
    example: '补充了素材说明并调整标题',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeSummary?: string;
}
