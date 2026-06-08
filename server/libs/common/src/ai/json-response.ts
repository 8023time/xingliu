export function parseJsonObjectResponse(response: unknown): unknown {
  const content = extractMessageContent(response).trim();
  const jsonText = stripCodeFence(content);

  try {
    return JSON.parse(jsonText);
  } catch {
    const start = jsonText.indexOf('{');
    const end = jsonText.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(jsonText.slice(start, end + 1));
    }
    throw new Error('模型未返回有效 JSON 对象');
  }
}

function extractMessageContent(response: unknown): string {
  if (typeof response === 'string') return response;
  if (!response || typeof response !== 'object' || !('content' in response)) {
    throw new Error('模型响应缺少 content');
  }

  const content = (response as { content: unknown }).content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'text' in item && typeof item.text === 'string') return item.text;
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }

  throw new Error('模型响应 content 格式不支持');
}

function stripCodeFence(content: string) {
  const match = content.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match?.[1] ?? content;
}
