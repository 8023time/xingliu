import type { FileCategory, FileObjectPurpose } from '../../generated/prisma/enums';
import type { ImageProcessOptions } from './file-process.type';

export interface FileUploadInput {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface FileUploadOptions {
  purpose?: FileObjectPurpose;
  maxSizeBytes?: number;
  allowedCategories?: FileCategory[];
  imageProcessOptions?: ImageProcessOptions;
}
