import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import RPCClient from '@alicloud/pop-core';
import FastScanner from 'fastscan';
import { HIGH_RISK_SENSITIVE_WORDS } from './sensitive-words';

export interface AssetModerationResult {
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  labels: string[];
  reason?: string;
  requestId?: string;
  rawOutput: unknown;
}

export interface TextModerationResult extends AssetModerationResult {
  riskSpans: Array<{ index: number; text: string }>;
}

interface AliyunImageModerationResponse {
  Code?: number;
  Msg?: string;
  RequestId?: string;
  Data?: {
    RiskLevel?: AssetModerationResult['riskLevel'];
    Result?: Array<{
      Label?: string;
      Description?: string;
    }>;
  };
}

interface AliyunTextModerationResponse {
  Code?: number;
  Msg?: string;
  RequestId?: string;
  Data?: {
    RiskLevel?: AssetModerationResult['riskLevel'];
    Result?: Array<{
      Label?: string;
      Description?: string;
    }>;
  };
}

@Injectable()
export class ModerationService {
  private readonly client: RPCClient | null;
  private readonly textScanner = new FastScanner([...HIGH_RISK_SENSITIVE_WORDS]);

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('ALIBABA_CLOUD_ACCESS_KEY_ID');
    const accessKeySecret = this.configService.get<string>('ALIBABA_CLOUD_ACCESS_KEY_SECRET');
    const endpoint = this.configService.get<string>('ALIYUN_GREEN_ENDPOINT');

    this.client =
      accessKeyId && accessKeySecret && endpoint
        ? new RPCClient({
            accessKeyId,
            accessKeySecret,
            endpoint,
            apiVersion: '2022-03-02',
          })
        : null;
  }

  async moderateImage(imageUrl: string): Promise<AssetModerationResult> {
    if (!this.client) {
      throw new ServiceUnavailableException('图片审核服务未配置');
    }

    const service = this.configService.get<string>('ALIYUN_GREEN_IMAGE_SERVICE') ?? 'baselineCheck';
    const response: AliyunImageModerationResponse = await this.client.request(
      'ImageModeration',
      {
        Service: service,
        ServiceParameters: JSON.stringify({ imageUrl }),
      },
      { method: 'POST' },
    );

    if (response.Code !== 200 || !response.Data?.RiskLevel || !Array.isArray(response.Data.Result)) {
      throw new ServiceUnavailableException('图片审核服务返回无法解析');
    }

    const labels = response.Data.Result.map((item) => item.Label).filter((label): label is string =>
      Boolean(label && label !== 'nonLabel'),
    );
    const descriptions = response.Data.Result.map((item) => item.Description).filter(
      (description): description is string => Boolean(description),
    );

    return {
      riskLevel: response.Data.RiskLevel,
      labels,
      reason: descriptions.join('；') || undefined,
      requestId: response.RequestId,
      rawOutput: response,
    };
  }

  async moderateText(text: string): Promise<TextModerationResult> {
    const localHits = this.textScanner.search(text, { longest: true });
    if (localHits.length) {
      return {
        riskLevel: 'high',
        labels: ['local_high_risk'],
        reason: '命中本地高风险敏感词',
        riskSpans: localHits.map(([index, value]) => ({ index, text: value })),
        rawOutput: { localHits },
      };
    }
    if (!this.client) {
      throw new ServiceUnavailableException('文本审核服务未配置');
    }

    const service = this.configService.get<string>('ALIYUN_GREEN_TEXT_SERVICE') ?? 'ai_art_detection';
    const response: AliyunTextModerationResponse = await this.client.request(
      'TextModeration',
      {
        Service: service,
        ServiceParameters: JSON.stringify({ content: text }),
      },
      { method: 'POST' },
    );
    if (response.Code !== 200 || !response.Data?.RiskLevel || !Array.isArray(response.Data.Result)) {
      throw new ServiceUnavailableException('文本审核服务返回无法解析');
    }

    const labels = response.Data.Result.map((item) => item.Label).filter((label): label is string =>
      Boolean(label && label !== 'nonLabel'),
    );
    const descriptions = response.Data.Result.map((item) => item.Description).filter(
      (description): description is string => Boolean(description),
    );

    return {
      riskLevel: response.Data.RiskLevel,
      labels,
      reason: descriptions.join('；') || undefined,
      requestId: response.RequestId,
      riskSpans: [],
      rawOutput: response,
    };
  }
}
