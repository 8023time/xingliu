import type { NextConfig } from 'next';
import { Config } from '@xingliu/config';

const apiImageHosts = [
  Config.host.dev.api,
  Config.host.prod.api,
  process.env.NEXT_PUBLIC_API_HOST,
  process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).hostname : undefined,
].filter((hostname): hostname is string => Boolean(hostname));

const nextConfig: NextConfig = {
  allowedDevOrigins: [Config.host.dev.web],
  env: {
    NEXT_PUBLIC_WEB_HOST: Config.host.dev.web,
    NEXT_PUBLIC_WEB_PORT: String(Config.port.web),
    NEXT_PUBLIC_API_HOST: Config.host.dev.api,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      ...apiImageHosts.map((hostname) => ({
        protocol: 'https' as const,
        hostname,
      })),
      {
        protocol: 'http',
        hostname: 'localhost',
        port: String(Config.port.minio),
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: String(Config.port.minio),
      },
    ],
  },
};

export default nextConfig;
