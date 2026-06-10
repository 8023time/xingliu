import type { NextConfig } from 'next';
import { Config } from '@xingliu/config';

const nextConfig: NextConfig = {
  allowedDevOrigins: [Config.host.web],
  env: {
    NEXT_PUBLIC_WEB_HOST: Config.host.web,
    NEXT_PUBLIC_WEB_PORT: String(Config.port.web),
    NEXT_PUBLIC_API_HOST: Config.host.api,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
