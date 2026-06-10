import { Injectable, ServiceUnavailableException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import GreenClient, {
  ImageModerationRequest,
  TextModerationRequest,
  type TextModerationResponseBody,
} from '@alicloud/green20220302';
import { Config as OpenApiConfig } from '@alicloud/openapi-client';
import { MODERATION_PROVIDERS } from '../moderation.constants';
import type {
  ModerationProviderInput,
  ModerationProviderResult,
  ModerationRiskLevel,
  ModerationRiskSpan,
} from '../moderation.types';
import type { ModerationProvider } from './moderation-provider.interface';

const NON_RISK_LABELS = new Set(['', 'nonLabel', 'normal', 'pass']);
const ALIYUN_TEXT_CHUNK_SIZE = 500;

@Injectable()
export class AliyunGreenModerationProvider implements ModerationProvider {
  private readonly client: GreenClient | null;
  private readonly logger = new Logger(AliyunGreenModerationProvider.name);

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('ALIYUN_ACCESS_KEY_ID');
    const accessKeySecret = this.configService.get<string>('ALIYUN_ACCESS_KEY_SECRET');
    const RegionId = this.configService.get<string>('ALIYUN_GREEN_REGION_ID');
    const endpoint = this.configService.get<string>('ALIYUN_GREEN_ENDPOINT') ?? 'green-cip.cn-shanghai.aliyuncs.com';

    if (accessKeyId && accessKeySecret) {
      this.client = new GreenClient(
        new OpenApiConfig({
          endpoint,
          accessKeyId,
          accessKeySecret,
          type: 'access_key',
          RegionId,
        }),
      );
    } else {
      this.client = null;
    }

    if (!this.client) {
      this.logger.warn('阿里云内容安全服务未配置，相关功能将不可用。');
    } else {
      this.logger.log('阿里云内容安全服务已成功配置。');
    }
  }

  async moderate(input: ModerationProviderInput): Promise<ModerationProviderResult> {
    if (input.kind === 'image') {
      return this.moderateImage(input.imageUrl!);
    }

    return this.moderateText(input.text!, input.contextRiskSpans ?? []);
  }

  private async moderateImage(imageUrl: string): Promise<ModerationProviderResult> {
    const client = this.getClient();
    const service = this.configService.get<string>('ALIYUN_GREEN_IMAGE_SERVICE') ?? 'baselineCheck';
    const response = await client.imageModeration(
      new ImageModerationRequest({
        service,
        serviceParameters: JSON.stringify({ imageUrl }),
      }),
    );
    const body = response.body;

    if (body?.code !== 200 || !body.data) {
      throw new ServiceUnavailableException(`阿里云图片审核服务返回无法解析：${body?.msg ?? 'unknown error'}`);
    }

    const resultItems = body.data.result ?? [];
    const labels = resultItems
      .map((item) => item.label)
      .filter((label): label is string => Boolean(label && !NON_RISK_LABELS.has(label)));
    const descriptions = resultItems
      .map((item) => item.description)
      .filter((description): description is string => Boolean(description));

    return {
      riskLevel: this.normalizeRiskLevel(body.data.riskLevel),
      labels,
      reason: descriptions.join('；') || body.msg || undefined,
      provider: MODERATION_PROVIDERS.aliyunGreen,
      requestId: body.requestId,
      riskSpans: [],
      rawOutput: toJsonCompatible(body),
    };
  }

  private async moderateText(text: string, contextRiskSpans: ModerationRiskSpan[]): Promise<ModerationProviderResult> {
    const client = this.getClient();
    const service = this.configService.get<string>('ALIYUN_GREEN_TEXT_SERVICE') ?? 'ai_art_detection';
    const chunks = splitTextForAliyun(text);
    const bodies: TextModerationResponseBody[] = [];

    for (const [index, chunk] of chunks.entries()) {
      const response = await client.textModeration(
        new TextModerationRequest({
          service,
          serviceParameters: JSON.stringify({
            content: chunk,
            dataId: chunks.length > 1 ? `chunk-${index + 1}` : undefined,
          }),
        }),
      );
      const body = response.body;

      if (body?.code !== 200 || !body.data) {
        throw new ServiceUnavailableException(`阿里云文本审核服务返回无法解析：${body?.message ?? 'unknown error'}`);
      }

      bodies.push(body);
    }

    const labels = uniqueStrings(
      bodies.flatMap((body) => splitLabels(body.data?.labels).filter((label) => !NON_RISK_LABELS.has(label))),
    );
    const reason =
      uniqueStrings(bodies.flatMap((body) => [body.data?.descriptions, body.data?.reason].filter(isString))).join(
        '；',
      ) || undefined;

    return {
      riskLevel: labels.length ? 'medium' : 'none',
      labels,
      reason,
      provider: MODERATION_PROVIDERS.aliyunGreen,
      requestId:
        bodies
          .map((body) => body.requestId)
          .filter(Boolean)
          .join(',') || undefined,
      riskSpans: contextRiskSpans,
      rawOutput:
        bodies.length === 1 ? toJsonCompatible(bodies[0]) : { chunks: bodies.map((body) => toJsonCompatible(body)) },
    };
  }

  private getClient() {
    if (!this.client) {
      throw new ServiceUnavailableException('阿里云内容安全服务未配置');
    }

    return this.client;
  }

  private normalizeRiskLevel(riskLevel: string | undefined): ModerationRiskLevel {
    if (riskLevel === 'high' || riskLevel === 'medium' || riskLevel === 'low' || riskLevel === 'none') {
      return riskLevel;
    }

    return 'none';
  }
}

function splitLabels(labels: string | undefined) {
  return (labels ?? '')
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean);
}

function splitTextForAliyun(text: string) {
  const characters = Array.from(text);
  const chunks: string[] = [];

  for (let index = 0; index < characters.length; index += ALIYUN_TEXT_CHUNK_SIZE) {
    chunks.push(characters.slice(index, index + ALIYUN_TEXT_CHUNK_SIZE).join(''));
  }

  return chunks.length ? chunks : [''];
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

type JsonCompatible = string | number | boolean | null | JsonCompatible[] | { [key: string]: JsonCompatible };

function toJsonCompatible(value: unknown, seen = new WeakSet<object>()): JsonCompatible {
  if (value === null) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'undefined' || typeof item === 'function' || typeof item === 'symbol') {
        return null;
      }

      return toJsonCompatible(item, seen);
    });
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      return null;
    }
    seen.add(value);

    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => typeof entry !== 'undefined' && typeof entry !== 'function' && typeof entry !== 'symbol')
        .map(([key, entry]) => [key, toJsonCompatible(entry, seen)]),
    );
  }

  return null;
}
