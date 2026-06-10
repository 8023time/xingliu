export const InfoStorage = (PREFIX_NAME?: string) => {
  const PREFIX = PREFIX_NAME ?? '__xingliu__';
  const CLEAN_INTERVAL_MS = 2000;
  const CLEAN_LIMIT = 5;
  let cleanTimer: number | null = null;

  const getStorage = () => {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  };

  function set(key: string, value: unknown, expiresInMs: number = 0) {
    const storage = getStorage();
    if (!storage) return;

    const nowTime = Date.now();
    const data = {
      value,
      timestamp: nowTime,
      expires: expiresInMs ? nowTime + expiresInMs : 0,
    };
    storage.setItem(PREFIX + key, JSON.stringify(data));
  }

  function get(key: string): unknown | null {
    const storage = getStorage();
    if (!storage) return null;

    const dataJson = storage.getItem(PREFIX + key);
    if (!dataJson) return null;

    try {
      const data = JSON.parse(dataJson);
      const nowTime = Date.now();

      if (data.expires && nowTime > data.expires) {
        storage.removeItem(PREFIX + key);
        return null;
      }

      return data.value;
    } catch {
      storage.removeItem(PREFIX + key);
      return null;
    }
  }

  function remove(key: string) {
    const storage = getStorage();
    if (!storage) return;

    storage.removeItem(PREFIX + key);
  }

  function clean(limit = CLEAN_LIMIT) {
    const storage = getStorage();
    if (!storage) return;

    const storeKeys = Object.keys(storage).filter((key) => key.startsWith(PREFIX));
    let removed = 0;
    const nowTime = Date.now();

    for (let i = 0; i < storeKeys.length && removed < limit; i++) {
      const fullKey = storeKeys[i];
      try {
        const item = storage.getItem(fullKey);
        if (!item) {
          storage.removeItem(fullKey);
          removed++;
          continue;
        }

        const data = JSON.parse(item);
        if (data.expires && nowTime > data.expires) {
          storage.removeItem(fullKey);
          removed++;
        }
      } catch {
        storage.removeItem(fullKey);
        removed++;
      }
    }
  }

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
