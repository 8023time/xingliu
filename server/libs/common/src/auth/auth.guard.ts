import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthTokenPayloadType } from '@xingliu/shared/user';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '@libs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthTokenPayloadType }>();

    const Headers = req.headers;
    const authorization = Headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('未授权!!!');
    }
    const token = authorization.replace('Bearer ', '');

    try {
      const payload = this.jwtService.verify<AuthTokenPayloadType>(token);

      // 验证 token 的类型，确保它是一个访问令牌
      if (payload.tokenType !== 'access') {
        throw new UnauthorizedException('token 过期或无效!!!');
      }

      // 验证用户是否存在
      const user = await this.prismaService.user.findUnique({ where: { id: payload.userId } });

      if (!user) {
        throw new UnauthorizedException('用户不存在!!!');
      }

      // 验证 tokenVersion 是否匹配，确保令牌未过期
      if (payload.tokenVersion !== user.tokenVersion) {
        throw new UnauthorizedException('token 过期或无效!!!');
      }

      // 将用户信息保存在请求中
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('token 过期或无效!!!');
    }
  }
}
