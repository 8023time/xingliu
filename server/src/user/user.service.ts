import { BadRequestException, Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { FileService, PrismaService, ResponseService, type FileUploadInput } from '@libs/common';
import { FileCategory, FileObjectPurpose } from '@libs/common/generated/prisma/enums';
import { AuthService } from '../auth/auth.service';
import type {
  AuthToken,
  AuthUser,
  LoginUserResponse,
  RegisterUserResponse,
  UploadAvatarResponse,
} from '@xingliu/shared/user';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly responseService: ResponseService,
    private readonly prismaService: PrismaService,
    private readonly authService: AuthService,
    private readonly fileService: FileService,
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
        email: email ?? null,
      },
      select: {
        id: true,
        phone: true,
        email: true,
        username: true,
        avatarUrl: true,
        status: true,
        tokenVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.responseService.success<RegisterUserResponse>(
      {
        token: this.authService.generateToken({
          userId: user.id,
          tokenVersion: user.tokenVersion,
        }),
        user: this.toAuthUser(user),
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
        createdAt: true,
        updatedAt: true,
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
          tokenVersion: user.tokenVersion,
        }),
        user: this.toAuthUser(user),
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
          createdAt: true,
          updatedAt: true,
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
          tokenVersion: user.tokenVersion,
        }),
        '刷新令牌成功',
      );
    } catch {
      return this.responseService.error(null, '无效的刷新令牌');
    }
  }

  async logout(userId: string) {
    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
    });
    return this.responseService.success(null, '退出登录成功');
  }

  async updateInfo(userId: string, updateUserDto: UpdateUserDto) {
    const { email, phone, username } = updateUserDto;

    // 检查新的手机号和邮箱是否已被其他用户注册
    const existingUser = await this.prismaService.user.findFirst({
      where: {
        id: { not: userId },
        OR: [{ phone }, ...(email ? [{ email }] : [])],
      },
      select: {
        phone: true,
        email: true,
      },
    });

    if (existingUser?.phone === phone) {
      return this.responseService.error(null, '手机号已被注册');
    }

    if (email && existingUser?.email === email) {
      return this.responseService.error(null, '邮箱已被注册');
    }

    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        phone,
        username,
        email: email ?? null,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        username: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.responseService.success<AuthUser>(this.toAuthUser(user), '更新用户信息成功');
  }

  async uploadAvatar(userId: string, avatar?: FileUploadInput) {
    if (!avatar) {
      throw new BadRequestException('请上传头像图片');
    }

    const uploadedFile = await this.fileService.upload(avatar, userId, {
      purpose: FileObjectPurpose.AVATAR,
      allowedCategories: [FileCategory.IMAGE],
    });

    const avatarUrl = uploadedFile.url;
    await this.prismaService.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return this.responseService.success<UploadAvatarResponse>({ avatarUrl }, '上传头像成功');
  }

  private toAuthUser(user: {
    id: string;
    email: string | null;
    phone: string;
    username: string;
    avatarUrl: string | null;
    status: AuthUser['status'];
    createdAt: Date;
    updatedAt: Date;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      username: user.username,
      avatarUrl: user.avatarUrl,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
