import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ArrayMaxSize,
} from 'class-validator';
import { AssetType } from '@libs/common/generated/prisma/enums';
import type { CreateAssetRequest } from '@xingliu/shared/asset';

export class CreateAssetDto implements CreateAssetRequest {
  @ApiProperty({
    description: '资产类型',
    enum: AssetType,
    example: 'IMAGE',
    required: false,
  })
  @IsOptional()
  @IsEnum(AssetType, { message: '不合法的资产类型' })
  type?: CreateAssetRequest['type'];

  @ApiProperty({
    description: '资产名称',
    example: '小红书种草配图_高清户外',
  })
  @IsString()
  @MinLength(1, { message: '资产名称不能为空' })
  @MaxLength(200, { message: '资产名称最多200个字符' })
  name!: string;

  @ApiProperty({
    description: '资产链接',
    example: 'https://tos.volces.com/assets/camp-01.png',
    required: false,
  })
  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: '请输入合法的资产 URL 链接' })
  @MaxLength(2048)
  url?: string;

  @ApiProperty({
    description: '是否跳过素材审核，封面直传时使用',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  skipModeration?: CreateAssetRequest['skipModeration'];

  @ApiProperty({
    description: '资产标签',
    example: ['户外', '露营', '种草风'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: '标签必须是数组格式' })
  @IsString({ each: true, message: '每个标签必须是字符串' })
  @ArrayMaxSize(10, { message: '单个资产最多绑定 10 个标签' }) // 防御性优化：防止恶意请求传入成千上万个标签压垮数据库
  @MaxLength(20, { each: true, message: '单个标签长度不能超过 20 个字符' }) // 防御性优化：限制单个标签的长度
  tags?: CreateAssetRequest['tags'];
}
