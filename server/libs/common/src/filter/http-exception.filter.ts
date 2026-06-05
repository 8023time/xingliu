import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

type ExceptionResponseObject = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  [key: string]: unknown;
};

/**
 * 全局 HTTP 异常过滤器，捕获所有抛出的 HttpException，并返回统一格式的 JSON 响应
 * 1. 返回统一数据结构
 * 2. 处理 ValidationPipe 抛出的异常，提取详细的验证错误信息
 * 3. 兼容其他类型的异常响应，确保 message 和 details 字段合理填充
 * 4. 包含请求路径和时间戳，方便前端调试和日志记录
 * 5. 适用于所有 HTTP 异常，提升后端错误处理的一致性和可维护性
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let finalMessage = exception.message;
    let finalDetails: unknown;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resObj = exceptionResponse as ExceptionResponseObject;

      if (Array.isArray(resObj.message)) {
        finalMessage = '参数校验失败';
        finalDetails = resObj.message;
      } else {
        const rest = { ...resObj };
        delete rest.message;
        delete rest.statusCode;
        delete rest.error;
        finalDetails = Object.keys(rest).length > 0 ? rest : null;
      }
    } else {
      finalDetails = exceptionResponse !== exception.message ? exceptionResponse : null;
    }

    const logFormat = `[${request.method}] ${request.url} - Status: ${status} - Message: ${finalMessage}`;

    if (status >= 500) {
      this.logger.error(logFormat, exception.stack);
    } else {
      this.logger.warn(logFormat);
    }

    return response.status(status).json({
      success: false,
      message: finalMessage,
      path: request.url,
      timestamp: new Date().toISOString(),
      details: finalDetails,
    });
  }
}
