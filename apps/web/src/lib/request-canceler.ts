import axios from 'axios';

const pendingRequests = new Map();

export const addPendingRequest = (config: unknown) => {
  const key = JSON.stringify(config);
  pendingRequests.set(key, axios.CancelToken.source());
};

export const removePendingRequest = (config: unknown) => {
  const key = JSON.stringify(config);
  const cancelToken = pendingRequests.get(key);
  if (cancelToken) {
    cancelToken.cancel('Request canceled');
    pendingRequests.delete(key);
  }
};
