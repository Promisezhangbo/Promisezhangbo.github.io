# 0. Vite 版本时间线

| 版本 | 时间 | 一句话 |
| --- | --- | --- |
| 1.x | 2020 | 早期，绑定 Vue |
| **2.0** | 2021-02 | 框架无关、插件 API 定型 |
| 3 | 2022 | 相对 2 的小破坏（Polyfill 等） |
| 4 | 2023 | CJS Node API 弃用路径、SWC 可选 |
| **5.0** | 2023-11 | Rollup 4、Node 18+ |
| 6 | 2024-11 | Environment API（多环境：client/ssr/自定义） |
| 7 | 2025 | 过渡；可用 `rolldown-vite` 预演 |
| **8.0** | 2026 | **默认 Rolldown + Oxc**，取代 esbuild（依赖优化/转译）和 Rollup（生产打包） |

## 8 相对 7 的配置改名

| 7 及以前 | 8 |
| --- | --- |
| `build.rollupOptions` | `build.rolldownOptions`（旧键会兼容一阵） |
| `optimizeDeps.esbuildOptions` | `optimizeDeps.rolldownOptions` |
| `esbuild: { jsxInject }` | `oxc: { ... }` |
| `transformWithEsbuild` | `transformWithOxc` |

插件钩子尽量保持和 Rollup/Vite 兼容，多数社区插件仍能用。

## 配套

| 包 | 说明 |
| --- | --- |
| `@vitejs/plugin-react` | Babel 或 oxc/swc 做 Fast Refresh；本仓库在用 |
| `@vitejs/plugin-vue` | Vue 3 SFC |
| `vite-plugin-qiankun` | 本仓库子应用 |
| Vitest | 测试，配置可与 Vite 共享 |

Vite **不是** 自己实现一套打包算法，而是调度：8 之前 esbuild+Rollup，8 起 Rolldown。
