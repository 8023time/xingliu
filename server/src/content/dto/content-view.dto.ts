import { ApiProperty } from '@nestjs/swagger';
import type { ContentViewStateResponse } from '@xingliu/shared/content';
import { IsUUID } from 'class-validator';

export class ContentViewDto {
  @ApiProperty({
    description: 'Content ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  contentId!: string;
}

export class ContentViewStateDto implements ContentViewStateResponse {
  @ApiProperty({
    description: 'Content ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  contentId!: string;

  @ApiProperty({
    description: 'Content view count',
    example: 1024,
  })
  viewCount!: number;
}
