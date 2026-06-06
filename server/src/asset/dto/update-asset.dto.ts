import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { UpdateAssetRequest } from '@xingliu/shared/asset';

export class UpdateAssetDto implements UpdateAssetRequest {
  @ApiPropertyOptional({
    description: '素材名称',
    example: '小红书种草配图_高清户外',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: '素材标签',
    example: ['户外', '露营'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: UpdateAssetRequest['tags'];
}
