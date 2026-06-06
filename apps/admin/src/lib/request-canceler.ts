import type { InternalAxiosRequestConfig } from 'axios';

const pendingRequests = new Map<string, AbortController>();

/**
 * 根据请求的配置，生成唯一的 Key 标识
 * 主要用在 请求拦截器 和 响应拦截器 中，确保同样的请求（方法+URL+参数）能被正确识别为重复请求
 */
export const getRequestKey = (config: InternalAxiosRequestConfig): string => {
  const { method, url, params, data } = config;

  // 将参数对象序列化为字符串，确保参数相同才判定为重复请求
  const paramsStr = params ? JSON.stringify(params) : '';
  const dataStr = typeof data === 'string' ? data : data ? JSON.stringify(data) : '';

  return [method, url, paramsStr, dataStr].join('&');
};

/**
 * 核心：添加请求到队列
 * 如果发现已经有相同的请求在处理中，直接取消掉前一个请求
 */
export const addPendingRequest = (config: InternalAxiosRequestConfig) => {
  const requestKey = getRequestKey(config);

  // 发现重复请求，直接取消上一次尚未结束的请求
  if (pendingRequests.has(requestKey)) {
    const controller = pendingRequests.get(requestKey);
    controller?.abort();
    pendingRequests.delete(requestKey);
  }

  // 为当前请求创建全新的 AbortController，并挂载到 Axios 的 signal 上
  const controller = new AbortController();
  config.signal = config.signal || controller.signal;
  pendingRequests.set(requestKey, controller);
};

/**
 * 请求完成或失败后，将请求从队列中移除
 * 主要用在 响应拦截器 中，确保请求结束后能正确清理队列，避免误杀后续同样的请求
 */
export const removePendingRequest = (config: InternalAxiosRequestConfig) => {
  const requestKey = getRequestKey(config);
  if (pendingRequests.has(requestKey)) {
    pendingRequests.delete(requestKey);
  }
};
