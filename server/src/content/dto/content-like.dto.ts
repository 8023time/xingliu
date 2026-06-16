import { ApiProperty } from '@nestjs/swagger';
import type { ContentLikeStateResponse } from '@xingliu/shared/content';
import { IsUUID } from 'class-validator';

export class ContentLikeDto {
  @ApiProperty({
    description: '内容 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  contentId!: string;
}

export class ContentLikeStateDto implements ContentLikeStateResponse {
  @ApiProperty({
    description: '内容 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  contentId!: string;

  @ApiProperty({
    description: '当前用户是否已点赞',
    example: true,
  })
  liked!: boolean;

  @ApiProperty({
    description: '内容点赞数',
    example: 128,
  })
  likeCount!: number;
}
