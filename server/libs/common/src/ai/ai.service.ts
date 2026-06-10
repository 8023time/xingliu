import { Injectable, ServiceUnavailableException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';

@Injectable()
export class AiService {
  private readonly model: ChatOpenAI | null;
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const baseURL = this.configService.get<string>('OPENAI_BASE_URL');
    const model = this.configService.get<string>('OPENAI_MODEL');

    if (apiKey && baseURL && model) {
      this.model = new ChatOpenAI({
        apiKey,
        model,
        temperature: 0.7,
        configuration: { baseURL },
      });
    } else {
      this.model = null;
    }

    if (!this.model) {
      this.logger.log('AI 功能未启用：缺少 API 配置（若不需要 AI 功能请忽略此提示）');
    } else {
      this.logger.log(`AI 模型已成功加载 [Model: ${model}] [BaseURL: ${baseURL}]`);
    }
  }

  getModel(serviceName: string) {
    if (!this.model) {
      throw new ServiceUnavailableException(`${serviceName}未配置`);
    }

    return this.model;
  }
}
