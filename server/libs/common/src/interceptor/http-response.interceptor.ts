import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

interface ResponseFormat<T> {
  timestamp: string;
  path: string;
  message: string;
  code: number;
  data: T;
  success: boolean;
}

@Injectable()
export class HttpResponseInterceptor implements NestInterceptor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseFormat<any>> {
    return next.handle().pipe(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map((data: ResponseFormat<any>) => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<Request>();
        return {
          timestamp: new Date().toISOString(),
          path: response.url,
          message: data.message ?? 'success',
          success: data.success ?? true,
          code: data.code ?? 200,
          data: transformBigInt(data.data) ?? null,
        };
      }),
    );
  }
}

/**
 * 处理 BIGINT 类型的数据
 * @param value 需要处理的数据
 * @returns 处理后的数据
 */
function transformBigInt(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(transformBigInt);
  }
  if (value !== null && typeof value === 'object') {
    if (value instanceof Date) {
      return value;
    }
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, transformBigInt(val)]));
  }
  return value;
}
