import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import type { LoginUserRequest } from '@cm/shared';

export class LoginUserDto implements LoginUserRequest {
  @ApiProperty({
    description: '手机号或邮箱',
    example: 'user@example.com',
  })
  @IsString()
  account!: string;

  @ApiProperty({
    description: 'Password',
    example: '123456',
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
