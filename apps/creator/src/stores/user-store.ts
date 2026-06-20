import { create } from 'zustand';
import type { AuthToken, AuthUser } from '@xingliu/shared/user';
import { InfoStorage } from '@/configs/infoStorage';

export interface AuthState {
  isLogin: boolean;
  user: AuthUser | null;
  token: AuthToken | null;

  setToken: (token: AuthToken) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

const userStorage = InfoStorage('__user__');
const authStorage = InfoStorage('__auth__');

const useAuthStore = create<AuthState>((set) => ({
  isLogin: !!userStorage.get('user') && !!authStorage.get('token'),
  user: userStorage.get('user') as AuthUser | null,
  token: authStorage.get('token') as AuthToken | null,

  // 设置 token
  setToken: (token: AuthToken) => {
    set({ token });
    authStorage.set('token', token, 7 * 24 * 60 * 60 * 1000); // 存储 token，7天过期
  },

  // 设置用户信息，并标记为已登录
  setUser: (user: AuthUser) => {
    set({
      user,
      isLogin: true,
    });
    userStorage.set('user', user, 7 * 24 * 60 * 60 * 1000); // 存储用户信息，7天过期
  },

  // 登出方法，清除用户信息和 token，并标记为未登录
  logout: () => {
    set({
      isLogin: false,
      user: null,
      token: null,
    });
    userStorage.remove('user');
    authStorage.remove('token');
  },
}));

export { useAuthStore };
