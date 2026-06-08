import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';

@Injectable()
export class AiService {
  private readonly model: ChatOpenAI | null;

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

    void this.model
      ?.invoke('测试连接')
      .then((res) => {
        console.warn(res);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  getModel(serviceName: string) {
    if (!this.model) {
      throw new ServiceUnavailableException(`${serviceName}未配置`);
    }

    return this.model;
  }
}
