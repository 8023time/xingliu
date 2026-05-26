import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthToken, AuthTokenPayload, AuthTokenPayloadType } from '@xingliu/shared/user';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  verifyToken(token: string): AuthTokenPayloadType {
    return this.jwtService.verify<AuthTokenPayloadType>(token);
  }

  generateToken(payload: AuthTokenPayload): AuthToken {
    return {
      accessToken: this.jwtService.sign<AuthTokenPayloadType>(
        { ...payload, tokenType: 'access' },
        { expiresIn: '15m' },
      ),
      refreshToken: this.jwtService.sign<AuthTokenPayloadType>(
        { ...payload, tokenType: 'refresh' },
        {
          expiresIn: '7d',
        },
      ),
    };
  }
}
