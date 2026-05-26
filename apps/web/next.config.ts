import type { NextConfig } from 'next';
import { Config } from '@xingliu/config';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_WEB_HOST: Config.host.web,
    NEXT_PUBLIC_WEB_PORT: String(Config.port.web),
    NEXT_PUBLIC_API_HOST: Config.host.api,
  },
};

export default nextConfig;
