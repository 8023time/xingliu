import type { ResponseFormat } from '@xingliu/shared/common';
import type {
  LoginUserRequest,
  LoginUserResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterUserRequest,
  RegisterUserResponse,
} from '../types';

export async function loginApi(data: LoginUserRequest): Promise<ResponseFormat<LoginUserResponse>> {
  const response = await fetch('/api/proxy/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function registerApi(data: RegisterUserRequest): Promise<ResponseFormat<RegisterUserResponse>> {
  const response = await fetch('/api/proxy/api/user/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function refreshTokenApi(data: RefreshTokenRequest): Promise<ResponseFormat<RefreshTokenResponse>> {
  const response = await fetch('/api/proxy/api/user/refreshToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
