import { BadRequestException, Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { parse } from 'node:path';
import type {
  FileProcessInput,
  FileProcessResult,
  ImageProcessOptions,
  ProcessedFileOutput,
} from './types/file-process.type';

@Injectable()
export class ImageProcessService {
  private readonly defaultOptions: Required<ImageProcessOptions> = {
    compressedMaxWidth: 1920,
    compressedMaxHeight: 1920,
    compressedQuality: 82,
    thumbnailSize: 320,
    thumbnailQuality: 76,
  };

  /**
   * 处理图片文件，生成压缩版本和缩略图，并提取图片元数据
   * 1. 压缩版本：调整图片尺寸以适应指定的最大宽度和高度，保持宽高比，并使用WebP格式进行压缩
   * 2. 缩略图：生成固定尺寸的缩略图，使用cover模式裁剪图片，并使用WebP格式进行压缩
   * 3. 提取元数据：读取图片的宽度、高度、格式、色彩空间、通道数、是否有Alpha通道、方向和密度等信息
   * 4. 返回处理结果，包括原始文件信息、生成的文件输出和提取的元数据
   * 处理过程中会捕获和处理可能出现的错误，例如无法解析图片文件等情况，并抛出相应的异常
   * @param input 包含图片文件的Buffer、原始文件名、MIME类型和文件大小等信息
   * @param options 可选的图片处理选项，包括压缩版本和缩略图的质量和尺寸设置
   * @returns 包含处理结果的对象，包括文件类别、原始文件信息、生成的文件输出和提取的元数据
   */
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
