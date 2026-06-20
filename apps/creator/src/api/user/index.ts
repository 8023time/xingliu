import type {
  RegisterUserRequest,
  LoginUserRequest,
  LoginUserResponse,
  RegisterUserResponse,
  RefreshTokenResponse,
  RefreshTokenRequest,
  UpdateUserInfoRequest,
  UpdateUserInfoResponse,
  UploadAvatarResponse,
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
export async function logoutApi(): Promise<ResponseFormat<null>> {
  return http.post('/user/logout');
}

/**
 * 刷新token接口
 * POST /api/user/refreshToken
 */
export async function refreshTokenApi(data: RefreshTokenRequest): Promise<ResponseFormat<RefreshTokenResponse>> {
  return http.post('/user/refreshToken', data);
}

/**
 * 更新用户信息接口
 * PUT /api/user/info
 */
export async function updateUserInfoApi(data: UpdateUserInfoRequest): Promise<ResponseFormat<UpdateUserInfoResponse>> {
  return http.put('/user/info', data);
}

/**
 * 上传更新用户头像接口
 * POST /api/user/avatar
 */
export async function uploadAvatarApi(file: File): Promise<ResponseFormat<UploadAvatarResponse>> {
  const formData = new FormData();
  formData.append('avatar', file);
  return http.post('/user/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
