import type { Readable } from 'node:stream';

export interface FileStorage {
  isConfigured(): boolean;
  uploadObject(objectName: string, content: Buffer | Readable, mimeType: string, size?: number): Promise<void>;
  removeObject(objectName: string): Promise<void>;
  getObject(objectName: string): Promise<Readable>;
  getPublicUrl(objectName: string): string;
}
