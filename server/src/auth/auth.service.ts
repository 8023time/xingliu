import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthToken, AuthTokenPayload } from '@xingliu/shared/user';

type GenerateTokenPayload = Omit<AuthTokenPayload, 'tokenType'>;

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  verifyToken(token: string): AuthTokenPayload {
    return this.jwtService.verify<AuthTokenPayload>(token);
  }

  generateToken(payload: GenerateTokenPayload): AuthToken {
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
