import type { CommonStatus, FileCategory, FileObjectPurpose } from '../../generated/prisma/enums';

export interface StoredProcessedOutput {
  variant: string;
  storageKey: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  metadata: Record<string, unknown>;
}

export interface FileRecord {
  id: string;
  purpose: FileObjectPurpose;
  category: FileCategory;
  originalName: string;
  objectPath: string;
  originalObjectPath: string;
  url: string;
  originalUrl: string;
  mimeType: string;
  sizeBytes: number;
  metadata: Record<string, unknown> | null;
  status: CommonStatus;
  createdAt: Date;
  updatedAt: Date;
}
