import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LogoutUserDto {
  @ApiProperty({
    description: '刷新令牌',
    example: 'jwt_refresh_token_string',
  })
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}
