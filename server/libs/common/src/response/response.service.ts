import { Injectable } from '@nestjs/common';

@Injectable()
export class ResponseService {
  success<T>(data: T, message = 'success', code = 200) {
    return {
      message,
      code,
      data,
    };
  }

  error(message: string, code = 500) {
    return {
      message,
      code,
    };
  }
}
