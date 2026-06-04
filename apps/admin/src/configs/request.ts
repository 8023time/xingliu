import axios, { type InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import errCode from '@/configs/errorCode';
import { useAuthStore } from '@/stores/user-store';
import { refreshTokenApi } from '@/api/user';

interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const http = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

let isRefreshing = false;
const failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

// 清空并执行/拒绝队列
const processQueue = (error: unknown, newAccessToken: string | null = null) => {
  failedQueue.forEach((item) => {
    if (error) {
      item.reject(error);
    } else if (newAccessToken) {
      item.resolve(newAccessToken);
    }
  });
  failedQueue.length = 0;
};

// 强行登出并跳转
const handleForceLogout = (msg: string) => {
  message.error(msg);
  useAuthStore.getState().logout();
  location.replace('/login');
};

http.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token?.accessToken) {
      config.headers.Authorization = `Bearer ${token.accessToken}`;
    }

    return config;
  },
  (error) => {
    message.error('请求发送失败');
    return Promise.reject(error);
  },
);

http.interceptors.response.use(
  (response) => {
    const { data } = response;

    if (data?.success) {
      return data;
    }

    message.error(data?.message || '请求失败');
    return Promise.reject(data);
  },
  async (error) => {
    if (!error.response) {
      message.error('网络连接失败，请检查网络');
      return Promise.reject(new Error('网络连接失败'));
    }

    const status = error.response?.status;
    const originalRequest = error.config as RetryRequestConfig;

    if (status !== 401) {
      const msg = status !== undefined ? (errCode as Record<number, string>)[status] : errCode.default;
      message.error(msg ?? errCode.default);
      return Promise.reject(new Error(msg ?? '请求失败'));
    }

    // 处理 401 错误，尝试刷新 token
    // 防死循环：如果该请求已经重试过一次，说明新 token 也没用，直接登出
    if (originalRequest._retry) {
      handleForceLogout('登录失效，请重新登录');
      return Promise.reject(error);
    }
    const refreshToken = useAuthStore.getState().token?.refreshToken;

    if (!refreshToken) {
      handleForceLogout('登录失效，请重新登录');
      return Promise.reject(new Error('没有 refreshToken'));
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (newAccessToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            resolve(http(originalRequest));
          },
          reject: (err: unknown) => {
            reject(err);
          },
        });
      });
    }

    // 第一个触发 401 的请求，开启刷新流程
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const res = await refreshTokenApi({ refreshToken });
      if (res.code !== 0) {
        message.error(res.message || '刷新 token 失败，请重新登录');
        useAuthStore.getState().logout();
        location.href = '/login';
        return Promise.reject(new Error(res.message || '刷新 token 失败'));
      }

      useAuthStore.getState().setToken(res.data);
      const newAccessToken = res.data.accessToken;
      processQueue(null, newAccessToken);
      // 执行当前这第一个触发 401 的请求
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return http(originalRequest);
    } catch (error) {
      // 刷新失败，通知队列里所有挂起的请求全部失败
      processQueue(error, null);
      handleForceLogout('会话已过期，请重新登录');
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export default http;
