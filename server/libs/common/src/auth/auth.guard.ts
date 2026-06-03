import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthTokenPayloadType } from '@xingliu/shared/user';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import type { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthTokenPayloadType }>();
    const Headers = req.headers; // 获取请求头信息
    const authorization = Headers.authorization; // 获取请求头信息
    if (!authorization) {
      throw new UnauthorizedException('未授权!!!');
    }
    const token = authorization.replace('Bearer ', ''); // 获取token

    try {
      const payload = this.jwtService.verify<AuthTokenPayloadType>(token);
      if (payload.tokenType !== 'access') {
        throw new UnauthorizedException('token 过期或无效!!!');
      }
      req.user = payload; // 将用户信息保存在请求中
      return true;
    } catch {
      throw new UnauthorizedException('token 过期或无效!!!');
    }
  }
}
