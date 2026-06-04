export type UserStatus = 'ACTIVE' | 'DISABLED' | 'DELETED';

interface User {
  id: string;
  email?: string | null;
  phone: string;
  password: string;
  username: string;
  avatarUrl: string | null;
  status: UserStatus;
}

export type accountType = string;

// 注册用户所需的字段类型
export type RegisterUserRequest = Pick<User, 'phone' | 'email' | 'username' | 'password'>;

// 登录用户所需的字段类型
export type LoginUserRequest = Pick<User, 'password'> & { account: accountType };

// 鉴权用户信息类型，包含用户的基本信息但不包含敏感字段
export type AuthUser = Omit<User, 'password'>;

// 刷新令牌请求类型
export type AuthToken = {
  accessToken: string;
  refreshToken: string;
};

// JWT 令牌载荷类型，包含用户的基本信息和权限信息
export type AuthTokenPayload = Pick<User, 'phone' | 'email'> & {
  userId: User['id'];
  tokenVersion: number;
};

// 用于区分访问令牌和刷新令牌
export type AuthTokenPayloadType = AuthTokenPayload & {
  tokenType: 'refresh' | 'access';
};

export interface UserProfileResponse extends AuthUser {}

// 登录返回的数据类型
export interface LoginUserResponse {
  token: AuthToken;
  user: AuthUser;
}

// 注册返回的登数据类型
export type RegisterUserResponse = LoginUserResponse;

// 刷新令牌请求的数据类型
export type RefreshTokenRequest = {
  refreshToken: string;
};

// 刷新令牌返回的数据类型
export type RefreshTokenResponse = LoginUserResponse;

// 退出登录需要的数据类型
export type LogoutUserRequest = {
  refreshToken: string;
};
