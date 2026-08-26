# 0. Rollup 版本时间线

| 版本 | 时间 | 一句话 |
| --- | --- | --- |
| 0.x | 2015 起 | Rich Harris（后来 Svelte） |
| **1.0** | 2018 | 稳定插件钩子 |
| **2.0** | 2020 | 破坏性：更严格的 treeshake、部分钩子调整 |
| **3.0** | 2022 | 打包器本体与 CLI 现代化 |
| **4.0** | 2023-10 | Node 18+、默认更好的 ESM、部分官方插件合并进核心 |

Vite **5** 起生产打包绑 Rollup 4。Vite **8** 不再默认调 Rollup。

## 你还在哪见到它

- `rollup.config.mjs` 打 `dist/index.js` + `d.ts`（很多组件库）
- **tsup** 内部：JS 用 esbuild，`.d.ts` 常用 rollup-plugin-dts
- `@rollup/plugin-node-resolve`、`commonjs`、`terser`、`replace`

Rolldown 的卖点之一就是 **尽量兼容这些 plugin 的钩子**。
