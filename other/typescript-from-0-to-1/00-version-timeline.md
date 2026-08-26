# 0. TypeScript 版本时间线

| 版本 | 时间 | 一句话 |
| --- | --- | --- |
| 1.0 | 2014 | 标注 JS 的超集 |
| **2.0** | 2016 | `null` 检查（`--strictNullChecks`） |
| 2.1 | 2016 | `keyof` / mapped types |
| 2.8 | 2018 | 条件类型 `T extends U ? X : Y` |
| **3.0** | 2018 | Project References、`unknown`、剩余元组 |
| 3.7 | 2019 | 可选链 `?.`、空值合并 `??`、assertion functions |
| 3.8 | 2020 | `import type` / `export type` |
| **4.0** | 2020 | 可变元组、class 属性推断 |
| 4.1 | 2020 | 模板字面量类型、key remapping |
| 4.5 | 2021 | `Awaited<T>`、`.mts/.cts` |
| **4.9** | 2022-11 | **`satisfies` 操作符** |
| **5.0** | 2023-03 | 标准装饰器、`const` 类型参数、**`moduleResolution: "bundler"`**、`verbatimModuleSyntax` |
| 5.4 | 2024 | `NoInfer<T>` |
| 5.5 | 2024 | 推断类型谓词、`isolatedDeclarations` 起步 |
| 5.8 | 2025 | **`erasableSyntaxOnly`**（禁 enum/namespace 等擦不掉的语法） |
| 5.9 | 2025 | 5.x 收官；本仓库仍锁 `~5.9.3` |
| **6.0** | 2026-03 | **过渡大版本**：改默认值、弃用旧 flag；类型系统与 5.9 仍同源（JS `tsc`） |
| **7.0** | 2026-07 | **Go 原生移植**；检查结果对齐 6.0；全量检查大约快 8–12 倍；**7.0 无稳定编译器 API**（计划 7.1） |

5.x 及以前：补丁号只修回归。  
**6：** 语言没换皮，**默认值和弃用**才是破坏。  
**7：** 实现换了语言（Go），类型检查语义跟 6；编辑器走 LSP。

## 6.0 / 7.0 新默认（和 5.x 对比）

升 6/7 时若 `tsconfig` 里没写这些，行为会变：

| 选项 | 5.x 缺省 | **≥6.0（7 继承）** |
| --- | --- | --- |
| `strict` | `false` | **`true`** |
| `module` | 常被推断成 `commonjs` 一类 | **`esnext`** |
| `target` | 偏老 | 当前稳定 ES（紧挨着 `esnext` 的那一档，如 ES2025） |
| `noUncheckedSideEffectImports` | 关 | **开** |
| `libReplacement` | 开 | **关** |
| `stableTypeOrdering` | 可关 | **开且 7 不能关** |
| `rootDir` | 推断公共根 | **默认为 `./`（tsconfig 所在目录）** |
| `types` | 自动收 `node_modules/@types` | **默认 `[]`，要全局类型必须显式列出**（旧行为 `"types": ["*"]`） |

6.0 可用 `"ignoreDeprecations": "6.0"` 暂时压警告；**7.0 会把 6 弃用的选项变成硬错误**。官方建议：**先升 6 清警告，再升 7**。

## 7.0 运行时/工具差异（不是类型语法）

| 点 | 含义 |
| --- | --- |
| 实现 | `tsc` 是原生二进制，不是 Node 里跑的 JS |
| 并行 | `--checkers`（类型检查 worker，默认 4）、`--builders`（`tsc -b` 并行项目）、`--singleThreaded` |
| `--watch` | 换了文件监视（Parcel watcher 的 Go 移植） |
| 编译器 API | **7.0 不带**；eslint / vue-tsc / svelte 等继续用 **6** 的 API |
| 并存 | `@typescript/typescript6` 提供 `tsc6`；可用 npm alias 让 `typescript` 指向 6、另装 7 的 `tsc` |

## 和模块系统相关的选项（最容易配错）

| 选项 | 版本 | 含义 |
| --- | --- | --- |
| `module: nodenext` | 4.7+ | 按 Node 的 ESM/CJS 规则 |
| `moduleResolution: bundler` | **≥5.0** | 给 Vite/webpack 用：允许扩展名、不强制 Node 的导出检查 |
| `allowImportingTsExtensions` | **≥5.0** | `import './a.ts'`，必须 `noEmit` 或 `emitDeclarationOnly` |
| `verbatimModuleSyntax` | **≥5.0** | 类型导入必须 `import type`，否则运行时会留下擦不掉的 import |
| `erasableSyntaxOnly` | **≥5.8** | 只允许能被抹掉的语法（禁 `enum`、`namespace`、参数属性） |
| `jsx: react-jsx` | **≥4.1**（配合 React 17 新运行时） | 不必 `import React` |

## 类型层面常用「从哪版开始」

| 知识点 | 版本 |
| --- | --- |
| `interface` / `type` / 联合 / 交叉 | 早期 |
| 泛型 | 早期 |
| `strictNullChecks` | **≥2.0** |
| `unknown`（替代不该用的 `any`） | **≥3.0** |
| 条件类型 / `infer` | **≥2.8** |
| 模板字面量类型 | **≥4.1** |
| `satisfies` | **≥4.9** |
| `const` type parameter | **≥5.0** |
