import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    return response.status((exception as HttpException).getStatus()).json({
      timestamp: new Date().toISOString(),
      path: request.url,
      message: (exception as HttpException).message,
      code: (exception as HttpException).getStatus(),
      scuccess: false,
    });
  }
}
