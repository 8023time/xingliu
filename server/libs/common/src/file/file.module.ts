import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FileService } from './file.service';
import { AudioProcessService } from './processors/audio-process.service';
import { DocumentProcessService } from './processors/document-process.service';
import { FileProcessService } from './processors/file-process.service';
import { ImageProcessService } from './processors/image-process.service';
import { VideoProcessService } from './processors/video-process.service';
import { MinioStorageService } from './storage/minio-storage.service';

@Module({
  imports: [PrismaModule],
  providers: [
    FileService,
    MinioStorageService,
    FileProcessService,
    ImageProcessService,
    VideoProcessService,
    AudioProcessService,
    DocumentProcessService,
  ],
  exports: [FileService],
})
export class FileModule {}
