import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches, IsOptional } from 'class-validator';
import type { UpdateUserInfoRequest } from '@xingliu/shared/user';

export class UpdateUserDto implements UpdateUserInfoRequest {
  @ApiProperty({
    description: '邮箱',
    example: 'cmse@qq.com',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: '请输入正确的邮箱格式',
  })
  email?: string;

  @ApiProperty({
    description: '手机号',
    example: '13800138000',
  })
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, {
    message: '请输入正确的手机号格式',
  })
  phone!: string;

  @ApiProperty({
    description: '用户名',
    example: '张三',
  })
  @IsString()
  @Length(1, 20, { message: '用户名长度必须在 1 到 20 位之间' })
  username!: string;
}
