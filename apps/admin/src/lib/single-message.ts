import { message } from 'antd';

const activeMessages = new Set<string>();

/**
 * 针对非业务错误的全局单例提示（防高并发刷屏）
 * @param msg 错误提示内容
 * @param duration 提示持续时间（秒）
 */
export const showSingleError = (msg: string, duration = 3) => {
  if (!msg) return;

  if (activeMessages.has(msg)) return;

  activeMessages.add(msg);

  message.error({
    content: msg,
    duration,
    onClose: () => {
      activeMessages.delete(msg);
    },
  });
};
