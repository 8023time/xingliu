export function parseJsonObjectResponse(response: unknown): unknown {
  const content = extractMessageContent(response).trim();
  const jsonText = stripCodeFence(content);
  const objectText = extractJsonObjectText(jsonText);

  for (const candidate of [jsonText, objectText]) {
    if (!candidate) continue;

    const parsed = tryParseJson(candidate);
    if (parsed.ok) return parsed.value;

    const sanitized = escapeControlCharactersInJsonStrings(candidate);
    if (sanitized !== candidate) {
      const sanitizedParsed = tryParseJson(sanitized);
      if (sanitizedParsed.ok) return sanitizedParsed.value;
    }
  }

  throw new Error('模型未返回有效 JSON 对象');
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

function extractJsonObjectText(content: string): string | undefined {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  return start >= 0 && end > start ? content.slice(start, end + 1) : undefined;
}

function tryParseJson(content: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(content) };
  } catch {
    return { ok: false };
  }
}

function escapeControlCharactersInJsonStrings(content: string): string {
  let result = '';
  let inString = false;
  let escaped = false;

  for (const char of content) {
    const code = char.charCodeAt(0);

    if (inString && code >= 0x00 && code <= 0x1f) {
      result += escapeControlCharacter(char, code);
      escaped = false;
      continue;
    }

    result += char;

    if (!inString) {
      if (char === '"') inString = true;
      continue;
    }

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') inString = false;
  }

  return result;
}

function escapeControlCharacter(char: string, code: number): string {
  switch (char) {
    case '\b':
      return '\\b';
    case '\t':
      return '\\t';
    case '\n':
      return '\\n';
    case '\f':
      return '\\f';
    case '\r':
      return '\\r';
    default:
      return `\\u${code.toString(16).padStart(4, '0')}`;
  }
}
