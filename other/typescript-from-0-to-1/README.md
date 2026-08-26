# TypeScript 从 0 到 1

给 JS 开发者补类型系统与编译选项。语言主线已到 **7.x（2026-07，Go 原生 `tsc`）**；本仓库目前仍锁 **`typescript: ~5.9.3`**（JS 实现的 `tsc`），类型语法和 7 兼容，差在默认值、速度和编译器 API。

官方：[typescriptlang.org](https://www.typescriptlang.org/) · [7.0 公告](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) · [6.0 公告](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)

## 怎么读

| 顺序 | 文档 | 版本基线 |
| --- | --- | --- |
| 0 | [版本时间线](./00-version-timeline.md) | 1 → **7.0** |
| 1 | [类型系统](./01-type-system.md) | 基础全程；`satisfies` **≥4.9** |
| 2 | [编译选项与工程](./02-compiler-and-project.md) | `strict`；`bundler` **≥5.0**；6/7 新默认 |
| 3 | [和本仓库](./03-this-repo.md) | 仍是 5.9 + Vite |
| 4 | [6.0 与 7.0](./04-ts-6-and-7.md) | **6 = 默认值过渡；7 = 原生编译器** |

最短路径：`strict`（**6/7 已默认 true**）→ 联合/泛型 → `moduleResolution: bundler` → 不要 `enum`。升 7 前先过一遍 6，清掉弃用选项；需要 `typescript-eslint` 等编译器 API 时 7.0 还要和 6 并存。
