export const Config = {
  host: {
    dev: {
      web: 'xingliu-test.8023time.com',
      admin: 'creator.xingliu-test.8023time.com',
      api: 'api.xingliu-test.8023time.com',
    },
    prod: {
      web: 'xingliu.8023time.com',
      admin: 'creator.xingliu.8023time.com',
      api: 'api.xingliu.8023time.com',
    },
  },

  port: {
    server: 3000,
    web: 8080,
    admin: 8081,
    minio: 9000,
  },
} as const;
