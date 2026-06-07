/**
 * 用户状态
 *
 * ACTIVE    正常
 * DISABLED  已禁用
 * DELETED   已注销（逻辑删除）
 */
export type UserStatus = 'ACTIVE' | 'DISABLED' | 'DELETED';

/**
 * 用户实体
 *
 * 对应数据库 User 表结构。
 * 包含系统内部字段和敏感信息，仅用于服务端内部。
 */
export interface User {
  id: string;
  email?: string | null;
  phone: string;

  /** 密码哈希值，不允许返回给客户端 */
  password: string;

  username: string;
  avatarUrl: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * 当前认证用户
 *
 * 用于登录成功、获取个人信息等场景。
 * 已移除敏感字段 password。
 */
export type AuthUser = Omit<User, 'password'>;

/**
 * JWT载荷
 *
 * tokenVersion 用于令牌失效控制。
 * tokenType 用于区分 AccessToken 与 RefreshToken。
 */
export type AuthTokenPayload = {
  userId: User['id'];
  tokenVersion: number;
  tokenType: 'refresh' | 'access';
};

/**
 * 用户认证令牌
 */
export interface AuthToken {
  accessToken: string;
  refreshToken: string;
}

/**
 * 认证接口统一响应
 *
 * 适用于：
 * - 注册
 * - 登录
 * - 刷新登录态
 */
export interface AuthResponse {
  token: AuthToken;
  user: AuthUser;
}

/**
 * 注册请求
 */
export type RegisterUserRequest = Pick<User, 'phone' | 'email' | 'username' | 'password'>;

/**
 * 注册响应
 */
export type RegisterUserResponse = AuthResponse;

/**
 * 登录请求
 *
 * account 支持手机号或邮箱登录。
 */
export interface LoginUserRequest {
  account: NonNullable<User['email']> | User['phone'];
  password: string;
}

/**
 * 登录响应
 */
export type LoginUserResponse = AuthResponse;

/**
 * 刷新令牌请求
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * 刷新令牌响应
 */
export type RefreshTokenResponse = AuthToken;

/**
 * 更新用户信息请求
 */
export type UpdateUserInfoRequest = Pick<User, 'email' | 'phone' | 'username'>;

/**
 * 更新用户信息响应
 */
export type UpdateUserInfoResponse = AuthUser;

/**
 * 上传头像响应
 */
export interface UploadAvatarResponse {
  avatarUrl: string;
}
