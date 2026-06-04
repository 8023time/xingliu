import type {
  RegisterUserRequest,
  LoginUserRequest,
  LoginUserResponse,
  RegisterUserResponse,
  RefreshTokenResponse,
  RefreshTokenRequest,
  LogoutUserRequest,
} from '@xingliu/shared/user';
import type { ResponseFormat } from '@xingliu/shared/common';
import http from '@/configs/request';

/**
 * 登录接口
 * POST /api/user/login
 */
export async function loginApi(data: LoginUserRequest): Promise<ResponseFormat<LoginUserResponse>> {
  return http.post('/user/login', data);
}

/**
 * 注册接口
 * POST /api/user/register
 */
export async function registerApi(data: RegisterUserRequest): Promise<ResponseFormat<RegisterUserResponse>> {
  return http.post('/user/register', data);
}

/**
 * 登出接口
 * POST /api/user/logout
 */
export async function logoutApi(data: LogoutUserRequest): Promise<ResponseFormat<null>> {
  return http.post('/user/logout', data);
}

/**
 * 刷新token接口
 * POST /api/user/refreshToken
 */
export async function refreshTokenApi(data: RefreshTokenRequest): Promise<ResponseFormat<RefreshTokenResponse>> {
  return http.post('/user/refreshToken', data);
}
