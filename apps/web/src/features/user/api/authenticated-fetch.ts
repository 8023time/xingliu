import { refreshTokenApi } from '@/features/user/api/auth';
import { useAuthStore } from '@/stores/user-store';

let refreshPromise: Promise<string> | null = null;

export async function getValidAccessToken() {
  const token = useAuthStore.getState().token;
  if (!token) {
    return null;
  }

  if (!isJwtExpiring(token.accessToken)) {
    return token.accessToken;
  }

  return refreshAccessToken();
}

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return fetch(input, init);
  }

  const response = await fetch(input, withAuthorization(init, accessToken));
  if (response.status !== 401) {
    return response;
  }

  const refreshedAccessToken = await refreshAccessToken();
  return fetch(input, withAuthorization(init, refreshedAccessToken));
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessTokenOnce().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function refreshAccessTokenOnce() {
  const token = useAuthStore.getState().token;
  if (!token?.refreshToken) {
    useAuthStore.getState().logout();
    throw new Error('UNAUTHORIZED');
  }

  const result = await refreshTokenApi({ refreshToken: token.refreshToken });
  if (result.code !== 0 || !result.data) {
    useAuthStore.getState().logout();
    throw new Error('UNAUTHORIZED');
  }

  useAuthStore.getState().setToken(result.data);
  return result.data.accessToken;
}

function withAuthorization(init: RequestInit, accessToken: string): RequestInit {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);

  return {
    ...init,
    headers,
  };
}

function isJwtExpiring(token: string) {
  const expiresAt = readJwtExpiresAt(token);
  if (!expiresAt) {
    return true;
  }

  return expiresAt - Date.now() <= 30_000;
}

function readJwtExpiresAt(token: string) {
  const [, payload] = token.split('.');
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const parsed = JSON.parse(window.atob(padded)) as { exp?: unknown };
    return typeof parsed.exp === 'number' ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
}
