import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, Length } from 'class-validator';
import type { RegisterUserRequest } from '@xingliu/shared/user';

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
  @Length(1, 12, { message: '用户名长度必须在 1 到 12 个字符之间' })
  username!: string;

  @ApiProperty({
    description: '密码',
    example: '123456abc',
  })
  @IsString()
  @Length(6, 16, { message: '密码长度必须在 6 到 16 位之间' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]+$/, {
    message: '密码必须包含字母和数字',
  })
  password!: string;
}
