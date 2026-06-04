import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import type { LogoutUserRequest } from '@xingliu/shared/user';

export class LogoutUserDto implements LogoutUserRequest {
  @ApiProperty({
    description: '刷新令牌',
    example: 'jwt_refresh_token_string',
  })
  @IsString()
  refreshToken!: string;
}
