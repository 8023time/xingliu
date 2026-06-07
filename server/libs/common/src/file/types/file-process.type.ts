export type FileProcessCategory = 'image' | 'video' | 'audio' | 'document' | 'unknown';
export type ProcessedFileVariant = 'compressed' | 'thumbnail';

export interface FileProcessInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface DetectedFileType {
  ext: string;
  mime: string;
}

export interface ImageProcessOptions {
  compressedMaxWidth?: number;
  compressedMaxHeight?: number;
  compressedQuality?: number;
  thumbnailSize?: number;
  thumbnailQuality?: number;
}

export interface ProcessedFileOutput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
  variant: ProcessedFileVariant;
  metadata: Record<string, unknown>;
}

export interface FileProcessResult {
  category: FileProcessCategory;
  detectedType?: DetectedFileType;
  metadata: Record<string, unknown>;
  outputs: ProcessedFileOutput[];
}

export interface FileProcessOptions {
  image?: ImageProcessOptions;
}

export interface FileProcessor {
  process(input: FileProcessInput, options?: FileProcessOptions): Promise<FileProcessResult>;
  getCategory(mimeType: string): FileProcessCategory;
}
