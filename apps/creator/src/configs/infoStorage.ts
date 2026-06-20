export const InfoStorage = (PREFIX_NAME?: string) => {
  const PREFIX = PREFIX_NAME ?? '__xingliu__';
  const CLEAN_INTERVAL_MS = 2000;
  const CLEAN_LIMIT = 5;
  let cleanTimer: number | null = null;

  /**
   * 设置本地存储项。
   * @param {string} key - 存储项的键名。
   * @param {unknown} value - 存储项的值。
   * @param {number} [expiresInMs=0] - 可选。过期时间，单位毫秒。如果为 0 或不提供，则永不过期。
   */
  function set(key: string, value: unknown, expiresInMs: number = 0) {
    const nowTime = Date.now();
    const data = {
      value,
      timestamp: nowTime,
      expires: expiresInMs ? nowTime + expiresInMs : 0,
    };
    localStorage.setItem(PREFIX + key, JSON.stringify(data));
  }

  /**
   * 获取本地存储项。
   * @param {string} key - 存储项的键名。
   * @returns {unknown | null} - 返回存储项的值，如果过期、不存在或解析失败则返回 null。
   */
  function get(key: string): unknown | null {
    const dataJson = localStorage.getItem(PREFIX + key);
    if (!dataJson) return null;

    try {
      const data = JSON.parse(dataJson);
      const nowTime = Date.now();

      if (data.expires && nowTime > data.expires) {
        localStorage.removeItem(PREFIX + key);
        return null;
      }

      return data.value;
    } catch {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
  }

  /**
   * 移除本地存储项。
   * @param {string} key - 要移除存储项的键名。
   */
  function remove(key: string) {
    localStorage.removeItem(PREFIX + key);
  }

  /**
   * 清理已过期的本地存储项。
   * @param {number} [limit=CLEAN_LIMIT] - 可选。每次清理的最大数量。
   */
  function clean(limit = CLEAN_LIMIT) {
    const storeKeys = Object.keys(localStorage).filter((key) => key.startsWith(PREFIX));
    let removed = 0;
    const nowTime = Date.now();

    for (let i = 0; i < storeKeys.length && removed < limit; i++) {
      const fullKey = storeKeys[i];
      try {
        const item = localStorage.getItem(fullKey);
        if (!item) {
          localStorage.removeItem(fullKey);
          removed++;
          continue;
        }

        const data = JSON.parse(item);
        if (data.expires && nowTime > data.expires) {
          localStorage.removeItem(fullKey);
          removed++;
        }
      } catch {
        localStorage.removeItem(fullKey);
        removed++;
      }
    }
  }

  /**
   * 启动定时自动清理器。
   * @param {number} [interval=CLEAN_INTERVAL_MS] - 可选。清理间隔时间，单位毫秒。
   */
  function startAutoClean(interval: number = CLEAN_INTERVAL_MS) {
    if (cleanTimer) return;

    const schedule = () => {
      if (globalThis.requestIdleCallback) {
        globalThis.requestIdleCallback(() => {
          clean();
          cleanTimer = window.setTimeout(schedule, interval);
        });
      } else {
        clean();
        cleanTimer = window.setTimeout(schedule, interval);
      }
    };
    schedule();
  }

  /**
   * 停止定时自动清理器。
   */
  function stopAutoClean() {
    if (cleanTimer !== null) {
      clearTimeout(cleanTimer);
      cleanTimer = null;
    }
  }

  return {
    set,
    get,
    remove,
    clean,
    startAutoClean,
    stopAutoClean,
  };
};
