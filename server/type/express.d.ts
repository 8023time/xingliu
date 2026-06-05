import type { AuthTokenPayload } from '@xingliu/shared/user';

declare module 'express' {
  interface Request {
    user: AuthTokenPayload;
  }
}
