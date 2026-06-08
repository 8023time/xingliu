import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthToken, AuthTokenPayload } from '@xingliu/shared/user';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * 验证 JWT token 的有效性，并返回解码后的 payload。
   * @param token - 需要验证的 JWT token
   * @returns 解码后的 AuthTokenPayload 对象
   */
  verifyToken(token: string): AuthTokenPayload {
    return this.jwtService.verify<AuthTokenPayload>(token);
  }

  /**
   * 生成新的 JWT token，包括 access token 和 refresh token。
   * @param payload - 需要包含在 token 中的有效载荷，必须包含 userId 和 tokenVersion
   * @returns 包含 accessToken 和 refreshToken 的 AuthToken 对象
   */
  generateToken(payload: Omit<AuthTokenPayload, 'tokenType'>): AuthToken {
    return {
      accessToken: this.jwtService.sign<AuthTokenPayload>({ ...payload, tokenType: 'access' }, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign<AuthTokenPayload>(
        { ...payload, tokenType: 'refresh' },
        {
          expiresIn: '7d',
        },
      ),
    };
  }
}
