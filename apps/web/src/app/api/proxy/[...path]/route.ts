import { NextResponse, type NextRequest } from 'next/server';
import { getApiBaseUrl } from '@/lib/api-url';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params);
}

async function proxyRequest(request: NextRequest, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const targetUrl = new URL(path.join('/'), `${getApiBaseUrl()}/`);
  targetUrl.search = request.nextUrl.search;
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();

  const response = await fetch(targetUrl, {
    method: request.method,
    cache: 'no-store',
    headers: {
      accept: request.headers.get('accept') ?? 'application/json',
      'content-type': request.headers.get('content-type') ?? 'application/json',
      ...(request.headers.get('authorization') ? { authorization: request.headers.get('authorization') as string } : {}),
    },
    body,
  });

  const responseBody = await response.text();
  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json; charset=utf-8',
    },
  });
}
