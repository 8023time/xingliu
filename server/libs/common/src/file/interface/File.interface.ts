import type { FileRecord } from '../types/file-record.type';
import type { FileUploadInput, FileUploadOptions } from '../types/file-upload.type';

export class FileInterface {
  upload(file: FileUploadInput, userId: string, options?: FileUploadOptions): Promise<FileRecord> {
    void file;
    void userId;
    void options;
    throw new Error('FileInterface.upload must be implemented');
  }

  findOne(fileId: string, userId: string): Promise<FileRecord> {
    void fileId;
    void userId;
    throw new Error('FileInterface.findOne must be implemented');
  }

  remove(fileId: string, userId: string): Promise<void> {
    void fileId;
    void userId;
    throw new Error('FileInterface.remove must be implemented');
  }
}
