import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { Config } from '@xingliu/config';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: 'stats.html',
      gzipSize: true,
      brotliSize: true,
      open: false,
    }),
  ],

  server: {
    host: '0.0.0.0',
    port: Config.port.admin,
    strictPort: true,
    allowedHosts: [Config.host.dev.admin],
    open: `http://${Config.host.dev.admin}`,
    proxy: {
      '/api': {
        target: `http://${Config.host.dev.api}`,
        changeOrigin: true,
      },
    },
  },

  // 别名
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@Tip': fileURLToPath(new URL('./src/components/editor/Tiptap', import.meta.url)),
    },
  },
});
