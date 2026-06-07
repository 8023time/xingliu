import { BadRequestException, Injectable } from '@nestjs/common';
import { parse } from 'node:path';
import sharp from 'sharp';
import type { FileProcessInput, FileProcessResult, ImageProcessOptions, ProcessedFileOutput } from '../types';

@Injectable()
export class ImageProcessService {
  private readonly defaultOptions: Required<ImageProcessOptions> = {
    compressedMaxWidth: 1920,
    compressedMaxHeight: 1920,
    compressedQuality: 82,
    thumbnailSize: 320,
    thumbnailQuality: 76,
  };

  async process(input: FileProcessInput, options: ImageProcessOptions = {}): Promise<FileProcessResult> {
    const normalizedOptions = { ...this.defaultOptions, ...options };
    const image = sharp(input.buffer, { failOn: 'error' });
    const metadata = await this.readMetadata(image);
    const baseName = this.getSafeBaseName(input.originalName);

    const compressed = await image
      .clone()
      .rotate()
      .resize({
        width: normalizedOptions.compressedMaxWidth,
        height: normalizedOptions.compressedMaxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: normalizedOptions.compressedQuality })
      .toBuffer({ resolveWithObject: true });

    const thumbnail = await image
      .clone()
      .rotate()
      .resize({
        width: normalizedOptions.thumbnailSize,
        height: normalizedOptions.thumbnailSize,
        fit: 'cover',
        withoutEnlargement: false,
      })
      .webp({ quality: normalizedOptions.thumbnailQuality })
      .toBuffer({ resolveWithObject: true });

    const outputs: ProcessedFileOutput[] = [
      {
        buffer: compressed.data,
        filename: `${baseName}.compressed.webp`,
        mimeType: 'image/webp',
        size: compressed.data.length,
        variant: 'compressed',
        metadata: {
          width: compressed.info.width,
          height: compressed.info.height,
          format: compressed.info.format,
        },
      },
      {
        buffer: thumbnail.data,
        filename: `${baseName}.thumbnail.webp`,
        mimeType: 'image/webp',
        size: thumbnail.data.length,
        variant: 'thumbnail',
        metadata: {
          width: thumbnail.info.width,
          height: thumbnail.info.height,
          format: thumbnail.info.format,
        },
      },
    ];

    return {
      category: 'image',
      metadata: {
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: input.size,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        space: metadata.space,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation,
        density: metadata.density,
      },
      outputs,
    };
  }

  private async readMetadata(image: sharp.Sharp) {
    try {
      return await image.metadata();
    } catch {
      throw new BadRequestException('无法解析图片文件');
    }
  }

  private getSafeBaseName(originalName: string): string {
    const parsedName = parse(originalName).name;
    const safeName = parsedName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return safeName || 'image';
  }
}
