import { Module } from '@nestjs/common';
import { FileProcessService } from './file-process.service';
import { ImageProcessService } from './image-process.service';
import { VideoProcessService } from './video-process.service';
import { AudioProcessService } from './audio-process.service';
import { DocumentProcessService } from './document-process.service';

@Module({
  providers: [
    FileProcessService,
    ImageProcessService,
    VideoProcessService,
    AudioProcessService,
    DocumentProcessService,
  ],
  exports: [FileProcessService],
})
export class FileProcessModule {}
