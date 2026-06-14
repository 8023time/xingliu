import { Config } from '@xingliu/config';

export function buildApiUrl(path: string) {
  if (typeof window !== 'undefined') {
    return `/api/proxy${path}`;
  }

  return `${getApiBaseUrl()}${path}`;
}

export function getApiBaseUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_API_URL;
  if (explicitUrl) {
    return explicitUrl.replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:${Config.port.server}`;
  }

  const host = process.env.NEXT_PUBLIC_API_HOST ?? Config.host.prod.api;
  return `https://${host}`.replace(/\/+$/, '');
}
