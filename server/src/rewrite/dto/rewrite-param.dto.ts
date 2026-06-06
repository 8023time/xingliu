import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RewriteContentParamDto {
  @ApiProperty({
    description: '内容 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  contentId!: string;
}

export class RewriteAcceptParamDto extends RewriteContentParamDto {
  @ApiProperty({
    description: '合规改写记录 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  rewriteId!: string;
}
