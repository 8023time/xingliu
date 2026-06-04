import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';
import type { LoginUserRequest } from '@xingliu/shared/user';

export class LoginUserDto implements LoginUserRequest {
  @ApiProperty({
    description: '手机号或邮箱',
    example: 'user@example.com',
  })
  @IsString()
  @Matches(/^(?:1[3-9]\d{9}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/, {
    message: '请输入正确的手机号或邮箱格式',
  })
  account!: string;

  @ApiProperty({
    description: 'Password',
    example: '123456',
  })
  @IsString()
  @Length(6, 16, { message: '密码长度必须在 6 到 16 位之间' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]+$/, {
    message: '密码必须包含字母和数字',
  })
  password!: string;
}
