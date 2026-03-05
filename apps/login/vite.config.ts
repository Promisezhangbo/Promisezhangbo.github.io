import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import qiankun from 'vite-plugin-qiankun';
import dayjs from 'dayjs';

// https://vite.dev/config/
export default defineConfig((config) => {
  const { mode } = config;
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = env.NODE_ENV === 'development';
  return {
    plugins: [
      ...(isDev ? [] : [react()]),
      qiankun('login', {
        useDevMode: true,
      }),
    ],
    build: {
      outDir: '../../dist/login',
      target: ['chrome110'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    define: {
      // 优先读构建时的环境变量，兜底读生成的文件
      __BUILD_TIME__: isDev ? undefined : `"${dayjs().format('YYYY-MM-DD HH:mm:ss')}"`,
    },
    base: isDev ? '/' : '/login/',
    server: {
      port: 9003,
      host: true,
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
  };
});
