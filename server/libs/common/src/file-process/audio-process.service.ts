import { Injectable } from '@nestjs/common';
import type { FileProcessInput, FileProcessResult } from './types/file-process.type';

@Injectable()
export class AudioProcessService {
  /**
   * 处理音频文件，提取基本元数据，目前不支持进一步处理。
   */
  process(input: FileProcessInput): FileProcessResult {
    return {
      category: 'audio',
      metadata: this.getBaseMetadata(input),
      outputs: [],
    };
  }

  private getBaseMetadata(input: FileProcessInput) {
    return {
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
      processingSupported: false,
    };
  }
}
