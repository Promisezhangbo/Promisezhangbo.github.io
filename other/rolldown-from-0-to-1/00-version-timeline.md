# 0. Rolldown 版本与工具链位置

| 时间 | 事件 |
| --- | --- |
| 2023–2024 | 公开开发，目标「Rust 实现的 Rollup」 |
| Vite 7 | 可选 `rolldown-vite` 预演 |
| **Vite 8（2026）** | **默认引擎**，不再默认调用 Rollup/esbuild |
| Rolldown **1.0** | 稳定期；独立 CLI 也能打库 |

同家族（Oxc 解析器）：

| 工具 | 角色 |
| --- | --- |
| Oxc | AST/解析/转译 |
| **Rolldown** | 打包 |
| Oxlint | lint |
| Oxfmt | format |
| Vite | 开发服务器 + 调用 Rolldown |
| tsdown | 库打包（生态方向，对标 tsup） |

## 为什么存在

- Rollup：产物漂亮、慢（JS）
- esbuild：快、插件模型和 Rollup 不同、应用拆包不如 Rollup 熟
- Rolldown：尽量 **Rollup 插件生态 + esbuild 量级速度**，让 Vite 开发/生产同一套打包语义
