import { Injectable } from '@nestjs/common';

@Injectable()
export class ResponseService {
  success<T>(data: T, message = 'success', code = 0) {
    return {
      message,
      code,
      data,
    };
  }

  error<T>(data: T, message: string, code = 1) {
    return {
      message,
      code,
      data,
    };
  }
}
