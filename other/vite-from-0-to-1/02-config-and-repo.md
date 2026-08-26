# 2. 配置、插件、本仓库

## 2.1 `defineConfig`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': '/src' } },
  server: { port: 9000, proxy: { '/api': 'http://127.0.0.1:3000' } },
  build: {
    outDir: 'dist',
    target: 'es2015',
    rolldownOptions: {
      output: { manualChunks: { vendor: ['react', 'react-dom'] } },
    },
  },
});
```

函数形式 `( { mode, command } ) => ({})` 可按 `serve`/`build` 分支。

## 2.2 插件钩子（简化）

和 Rollup 类似：`resolveId`、`load`、`transform`、`configureServer`（Vite 独有中间件）。`enforce: 'pre' | 'post'` 调顺序。

## 2.3 本仓库

- 根 `vite: ^8.0.1`，各 `apps/*/vite.config.ts`
- React：`@vitejs/plugin-react`
- **`build.rolldownOptions`**（不是 rollupOptions）设 `manualChunks`、文件名
- `base`：dev `/`，prod `/main/` 等子路径
- `server.proxy`：主应用 9000 反代子应用，配合 qiankun（见 `docs/local-dev-whistle-qiankun.md`）
- 别名 `@`、`@style-config` 与 tsconfig 对齐

子应用：`vite-plugin-qiankun` 让 dev/prod 都能当 qiankun 微应用。

## 2.4 调试

- `vite --debug`
- `build.sourcemap: true`
- 预构建缓存：`node_modules/.vite`，依赖变了要 `--force`

## 2.5 和 webpack 心智切换

| webpack | Vite |
| --- | --- |
| 开发也打包 | 开发 ESM 按需编译 |
| `file-loader` | 静态资源 `import url` 或放 `public/` |
| `DefinePlugin` | `define` / `import.meta.env` |
| `devServer.proxy` | `server.proxy` |
| `splitChunks` | `manualChunks` / Rolldown 策略 |
