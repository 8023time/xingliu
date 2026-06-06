import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssetParamDto {
  @ApiProperty({
    description: '素材 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  id!: string;
}
