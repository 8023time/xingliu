import { Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { LogoutUserDto } from './dto/logout-user.dto';
import { ResponseService, PrismaService } from '@libs/common';
import { AuthService } from '../auth/auth.service';
import type { LoginUserResponse, RegisterUserResponse, AuthToken } from '@xingliu/shared/user';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly responseService: ResponseService,
    private readonly prismaService: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const { phone, username, password, email } = registerUserDto;

    // 检查手机号和邮箱是否已被注册
    if (await this.prismaService.user.findUnique({ where: { phone } })) {
      return this.responseService.error(null, '手机号已被注册');
    }

    // 邮箱是可选的，如果提供了邮箱则需要检查是否已被注册
    if (email && (await this.prismaService.user.findUnique({ where: { email } }))) {
      return this.responseService.error(null, '邮箱已被注册');
    }

    // 创建用户
    const user = await this.prismaService.user.create({
      data: {
        phone,
        username,
        passwordHash: password,
        email: email || null,
      },
      select: {
        id: true,
        phone: true,
        email: true,
        username: true,
        avatarUrl: true,
        status: true,
        tokenVersion: true,
      },
    });

    return this.responseService.success<RegisterUserResponse>(
      {
        token: this.authService.generateToken({
          userId: user.id,
          phone,
          email: user.email ?? null,
          tokenVersion: user.tokenVersion,
        }),
        user: {
          id: user.id,
          email: user.email ?? null,
          phone: user.phone,
          username: user.username,
          avatarUrl: user.avatarUrl,
          status: user.status,
        },
      },
      '注册成功',
    );
  }

  async login(loginUserDto: LoginUserDto) {
    const { account, password } = loginUserDto;

    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [{ phone: account }, { email: account }],
      },
      select: {
        id: true,
        phone: true,
        email: true,
        username: true,
        avatarUrl: true,
        status: true,
        passwordHash: true,
        tokenVersion: true,
      },
    });

    if (!user) {
      return this.responseService.error(null, '账号或密码错误');
    }

    if (user.passwordHash !== password) {
      return this.responseService.error(null, '账号或密码错误');
    }

    return this.responseService.success<LoginUserResponse>(
      {
        token: this.authService.generateToken({
          userId: user.id,
          phone: user.phone,
          email: user.email ?? null,
          tokenVersion: user.tokenVersion,
        }),
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email ?? null,
          username: user.username,
          avatarUrl: user.avatarUrl,
          status: user.status,
        },
      },
      '登录成功',
    );
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = this.authService.verifyToken(refreshTokenDto.refreshToken);

      const user = await this.prismaService.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          phone: true,
          email: true,
          username: true,
          avatarUrl: true,
          status: true,
          tokenVersion: true,
        },
      });

      if (!user) {
        return this.responseService.error(null, '用户不存在');
      }

      // 如果 tokenVersion 不匹配，说明令牌已过期
      if (payload.tokenVersion !== user.tokenVersion) {
        return this.responseService.error(null, '刷新令牌已过期，请重新登录');
      }

      return this.responseService.success<AuthToken>(
        this.authService.generateToken({
          userId: user.id,
          phone: user.phone,
          email: user.email ?? null,
          tokenVersion: user.tokenVersion,
        }),
        '刷新令牌成功',
      );
    } catch {
      return this.responseService.error(null, '无效的刷新令牌');
    }
  }

  async logout(logoutUserDto: LogoutUserDto) {
    try {
      const payload = this.authService.verifyToken(logoutUserDto.refreshToken);

      await this.prismaService.user.update({
        where: { id: payload.userId },
        data: {
          tokenVersion: {
            increment: 1,
          },
        },
      });

      return this.responseService.success(null, '退出成功');
    } catch {
      return this.responseService.error(null, '无效的刷新令牌');
    }
  }
}
