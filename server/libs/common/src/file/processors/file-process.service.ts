import { Injectable } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import { AudioProcessService } from './audio-process.service';
import { DocumentProcessService } from './document-process.service';
import { ImageProcessService } from './image-process.service';
import { VideoProcessService } from './video-process.service';
import type {
  DetectedFileType,
  FileProcessCategory,
  FileProcessInput,
  FileProcessOptions,
  FileProcessResult,
  FileProcessor,
} from '../types';

@Injectable()
export class FileProcessService implements FileProcessor {
  constructor(
    private readonly imageProcessService: ImageProcessService,
    private readonly videoProcessService: VideoProcessService,
    private readonly audioProcessService: AudioProcessService,
    private readonly documentProcessService: DocumentProcessService,
  ) {}

  async process(input: FileProcessInput, options: FileProcessOptions = {}): Promise<FileProcessResult> {
    const detectedType = await this.detectFileType(input.buffer);
    const effectiveMimeType = detectedType?.mime ?? input.mimeType;
    const normalizedInput = {
      ...input,
      mimeType: effectiveMimeType,
    };
    const category = this.getCategory(effectiveMimeType);

    switch (category) {
      case 'image':
        return this.withDetectedType(
          await this.imageProcessService.process(normalizedInput, options.image),
          detectedType,
          input.mimeType,
        );
      case 'video':
        return this.withDetectedType(this.videoProcessService.process(normalizedInput), detectedType, input.mimeType);
      case 'audio':
        return this.withDetectedType(this.audioProcessService.process(normalizedInput), detectedType, input.mimeType);
      case 'document':
        return this.withDetectedType(
          this.documentProcessService.process(normalizedInput),
          detectedType,
          input.mimeType,
        );
      default:
        return {
          category: 'unknown',
          detectedType,
          metadata: {
            originalName: input.originalName,
            mimeType: effectiveMimeType,
            declaredMimeType: input.mimeType,
            size: input.size,
            processingSupported: false,
          },
          outputs: [],
        };
    }
  }

  getCategory(mimeType: string): FileProcessCategory {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';

    if (
      mimeType === 'application/pdf' ||
      mimeType.startsWith('text/') ||
      mimeType.includes('document') ||
      mimeType.includes('presentation') ||
      mimeType.includes('spreadsheet')
    ) {
      return 'document';
    }

    return 'unknown';
  }

  private async detectFileType(buffer: Buffer): Promise<DetectedFileType | undefined> {
    const detectedType = await fileTypeFromBuffer(buffer);

    if (!detectedType) {
      return undefined;
    }

    return {
      ext: detectedType.ext,
      mime: detectedType.mime,
    };
  }

  private withDetectedType(
    result: FileProcessResult,
    detectedType: DetectedFileType | undefined,
    declaredMimeType: string,
  ): FileProcessResult {
    return {
      ...result,
      detectedType,
      metadata: {
        ...result.metadata,
        declaredMimeType,
        detectedMimeType: detectedType?.mime ?? null,
        detectedExtension: detectedType?.ext ?? null,
      },
    };
  }
}
