import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import type { RefreshTokenRequest } from '@xingliu/shared/user';

export class RefreshTokenDto implements RefreshTokenRequest {
  @ApiProperty({
    description: '刷新令牌',
    example: 'refresh.token.here',
  })
  @IsString()
  refreshToken!: string;
}
