import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // '0.0.0.0' binds to all network interfaces, allowing access via http://127.0.0.1:3000
      // even when VPN, TUN adapter, or proxy is active
      host: '0.0.0.0',
      port: 3000,
      strictPort: false,
      cors: true,
      hmr: process.env.DISABLE_HMR !== 'true' ? {
        host: '127.0.0.1',
      } : false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
      cors: true,
    },
  };
});
