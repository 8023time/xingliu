import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { AiGenerateInput, AiGenerateResponse } from '@xingliu/shared/ai';
import type { ResponseFormat } from '@xingliu/shared/common';
import http from '@/configs/request';
import { useAuthStore } from '@/stores/user-store';

export type { AiGenerateInput, AiGenerateResponse, AiGenerated } from '@xingliu/shared/ai';

interface AiGenerateStreamHandlers {
  onTask?: (taskId: string) => void;
  onDelta?: (text: string) => void;
  onBodyDelta?: (text: string) => void;
  onDone: (result: AiGenerateResponse) => void;
  onError?: (message: string) => void;
}

interface AiGenerateStreamEventMap {
  task: { taskId: string };
  delta: { text: string };
  body_delta: { text: string };
  done: AiGenerateResponse;
  error: { message?: string };
}

/**
 * 生成 AI 内容接口
 * POST /api/ai/generate
 */
export async function generateContentApi(data: AiGenerateInput): Promise<ResponseFormat<AiGenerateResponse>> {
  return http.post('/ai/generate', data);
}

/**
 * 流式生成 AI 内容接口
 * POST /api/ai/generate/stream
 */
export async function generateContentStreamApi(
  data: AiGenerateInput,
  handlers: AiGenerateStreamHandlers,
  signal?: AbortSignal,
) {
  const accessToken = useAuthStore.getState().token?.accessToken;
  let completed = false;

  await fetchEventSource('/api/ai/generate/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(data),
    signal,
    openWhenHidden: true,
    async onopen(response) {
      if (!response.ok) {
        throw new Error(response.status === 401 ? '登录失效，请重新登录' : 'AI 流式生成请求失败');
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('text/event-stream')) {
        throw new Error('AI 流式生成响应格式错误');
      }
    },
    onmessage(message) {
      if (!message.data) return;

      const event = message.event as keyof AiGenerateStreamEventMap;
      if (event === 'task') {
        handlers.onTask?.(parseStreamData<'task'>(message.data).taskId);
        return;
      }

      if (event === 'delta') {
        handlers.onDelta?.(parseStreamData<'delta'>(message.data).text);
        return;
      }

      if (event === 'body_delta') {
        handlers.onBodyDelta?.(parseStreamData<'body_delta'>(message.data).text);
        return;
      }

      if (event === 'done') {
        completed = true;
        handlers.onDone(parseStreamData<'done'>(message.data));
        return;
      }

      if (event === 'error') {
        const errorMessage = parseStreamData<'error'>(message.data).message ?? 'AI 内容生成失败';
        handlers.onError?.(errorMessage);
        throw new Error(errorMessage);
      }
    },
    onclose() {
      if (!completed) {
        throw new Error('AI 流式生成连接中断');
      }
    },
    onerror(error) {
      throw error;
    },
  });
}

function parseStreamData<TEvent extends keyof AiGenerateStreamEventMap>(data: string) {
  return JSON.parse(data) as AiGenerateStreamEventMap[TEvent];
}
