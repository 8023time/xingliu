import { Injectable } from '@nestjs/common';
import type { FileProcessInput, FileProcessResult } from '../types';

@Injectable()
export class VideoProcessService {
  process(input: FileProcessInput): FileProcessResult {
    return {
      category: 'video',
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
