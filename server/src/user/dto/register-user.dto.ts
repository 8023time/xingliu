import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';
import type { RegisterUserRequest } from '@cm/shared';

export class RegisterUserDto implements RegisterUserRequest {
  @ApiProperty({
    description: '用户手机号',
    example: '13812345678',
  })
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入有效的手机号' })
  phone!: string;

  @ApiProperty({
    description: '用户邮箱',
    example: 'user@example.com',
  })
  @IsString()
  @Matches(/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/, { message: '请输入有效的邮箱地址' })
  email!: string;

  @ApiProperty({
    description: '用户名',
    example: '张三',
  })
  @IsString()
  @MinLength(2, { message: '用户名至少需要2个字符' })
  username!: string;

  @ApiProperty({
    description: '密码',
    example: 'P@ssw0rd!',
  })
  @IsString()
  @MinLength(6, { message: '密码至少需要6个字符' })
  password!: string;
}
