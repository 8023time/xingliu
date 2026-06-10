import { create } from 'zustand';
import type { AuthToken, AuthUser } from '@xingliu/shared/user';
import { InfoStorage } from '@/lib/storage';

const AUTH_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthState {
  isLogin: boolean;
  user: AuthUser | null;
  token: AuthToken | null;

  setAuth: (auth: { token: AuthToken; user: AuthUser }) => void;
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

  setAuth: ({ token, user }) => {
    set({
      isLogin: true,
      token,
      user,
    });
    authStorage.set('token', token, AUTH_EXPIRES_IN_MS);
    userStorage.set('user', user, AUTH_EXPIRES_IN_MS);
  },

  setToken: (token: AuthToken) => {
    set({ token });
    authStorage.set('token', token, AUTH_EXPIRES_IN_MS);
  },

  setUser: (user: AuthUser) => {
    set({
      isLogin: true,
      user,
    });
    userStorage.set('user', user, AUTH_EXPIRES_IN_MS);
  },

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
