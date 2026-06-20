export const Config = {
  host: {
    dev: {
      web: 'xingliu-test.8023time.com',
      creator: 'creator.xingliu-test.8023time.com',
      api: 'api.xingliu-test.8023time.com',
    },
    prod: {
      web: 'xingliu.8023time.com',
      creator: 'creator.xingliu.8023time.com',
      api: 'api.xingliu.8023time.com',
    },
  },

  port: {
    server: 3000,
    web: 8080,
    creator: 8081,
    minio: 9000,
  },
} as const;
