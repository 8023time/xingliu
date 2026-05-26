import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { Config } from '@xingliu/config';

export default defineConfig({
  plugins: [react()],

  server: {
    host: '0.0.0.0',
    port: Config.port.admin,
    strictPort: true,
    allowedHosts: [Config.host.admin],
    open: `http://${Config.host.admin}`,
    proxy: {
      '/api': {
        target: `http://${Config.host.api}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  // 别名
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
