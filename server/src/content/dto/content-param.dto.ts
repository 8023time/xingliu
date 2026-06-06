import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ContentParamDto {
  @ApiProperty({
    description: '内容 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  id!: string;
}
