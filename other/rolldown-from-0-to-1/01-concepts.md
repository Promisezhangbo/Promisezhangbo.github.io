# 1. 概念、配置、和 Vite 8

## 1.1 你怎么用到它

日常 **不必** `npx rolldown`。写 Vite 配置即可：

```ts
build: {
  rolldownOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
      },
      chunkFileNames: 'js/[name]-[hash].js',
    },
  },
}
```

本仓库 `apps/main/vite.config.ts` 已是这种写法（`@packages/vite-build-utils` 的 `appManualChunks`）。

独立 CLI（打库、实验）：`rolldown -c rolldown.config.js`，字段大体抄 Rollup 的 `input`/`output`/`external`/`plugins`。

## 1.2 兼容性

- 多数 **Rollup 插件** 的 `resolveId`/`load`/`transform` 能用。
- 深度依赖 Rollup **内部** 或仅存在于 JS 实现细节的插件可能坏。
- Vite 8 仍短期接受 `rollupOptions` / `esbuild` 并 **自动映射**，会弃用；新代码写 `rolldownOptions` / `oxc`。

## 1.3 和 esbuild / Rollup 对比

| | Rollup 4 | esbuild | Rolldown |
| --- | --- | --- | --- |
| 语言 | JS | Go | Rust |
| 插件生态 | 最成熟（库） | 自己一套 | 走 Rollup 模型 |
| Vite 里 | 7 及以前生产 | 7 及以前预构建+minify | **8 默认全程** |
| 拆 chunk | 强 | 弱一些 | 对齐 Rollup 并增强 |

## 1.4 将来可能用到的能力

官方/Vite 8 方向：更灵活的 chunk、模块级持久缓存、Module Federation、full bundle mode（实验）。应用侧等 Vite 文档稳定后再开。

## 1.5 排错

- 升级 8 后插件挂了：看是否必须 Rollup 独有钩子；试官方迁移表。
- `manualChunks` 函数签名若有出入，对照当前 `rolldown`/`vite` 类型（本仓库已在用对象/函数形式）。
- 预构建缓存：清 `node_modules/.vite`。
