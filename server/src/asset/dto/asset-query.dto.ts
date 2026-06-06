import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { AssetType, SafetyStatus } from '@libs/common/generated/prisma/enums';
import type { AssetQueryRequest } from '@xingliu/shared/asset';

export class AssetQueryDto implements AssetQueryRequest {
  @ApiPropertyOptional({
    description: '页码',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: '每页数量，最大 50',
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;

  @ApiPropertyOptional({
    description: '素材类型',
    enum: AssetType,
    example: AssetType.IMAGE,
  })
  @IsOptional()
  @IsEnum(AssetType)
  type?: AssetQueryRequest['type'];

  @ApiPropertyOptional({
    description: '素材安全审核状态',
    enum: SafetyStatus,
    example: SafetyStatus.PASS,
  })
  @IsOptional()
  @IsEnum(SafetyStatus)
  safetyStatus?: AssetQueryRequest['safetyStatus'];
}
