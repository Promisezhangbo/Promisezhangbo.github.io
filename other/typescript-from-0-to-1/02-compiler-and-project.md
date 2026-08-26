# 2. 编译选项与工程

`tsc` 读 `tsconfig.json`。Vite 项目常见：**`noEmit: true`**，只类型检查，打包器负责产出。

## 2.1 必懂的一组

| 选项 | 建议 | 说明 |
| --- | --- | --- |
| `strict` | 开 | **≥6.0 默认 true**；5.x 必须自己写 `"strict": true` |
| `target` | `ESNext` 或当前稳定 ES | 6/7 默认已是较新 ES；Vite 还会再处理 |
| `module` | `ESNext` | **≥6 默认 `esnext`** |
| `moduleResolution` | 应用用 **`bundler` ≥5.0**；发 npm 的库看 `nodenext` | |
| `jsx` | React 用 `react-jsx` **≥4.1** | |
| `skipLibCheck` | 开 | |
| `isolatedModules` | Vite 默认当 true 理解 | 每个文件必须能单独转译（不能只靠 `namespace` 跨文件） |
| `noEmit` | Vite 应用开 | |
| `types` | 需要的 `@types` 写清楚 | **≥6 默认 `[]`，不再自动灌入全部 `@types`** |
| `rootDir` | 源码在 `src/` 就写 `"./src"` | **≥6 默认是 tsconfig 所在目录** |

`lib`: 有哪些内置类型（`ESNext`、`DOM`）。Node 脚本加 `@types/node`，不要把 DOM 硬塞进纯 Node 包。

## 2.2 路径与工程引用

- `baseUrl` + `paths`：别名；Vite 里还要配一份 `resolve.alias`，**两边都要有**。
- **Project References ≥3.0**：`{ "references": [{ "path": "./packages/foo" }] }` + 子项目 `composite`。本仓库用 `tsc -b`（build mode）做各 app 的 typecheck。

## 2.3 ESM / CJS 坑

- `"type": "module"` 的包里 `.ts` 按 ESM 想；`require()` 要 CJS。
- `verbatimModuleSyntax` **≥5.0**：`import { type Foo, bar } from 'x'` 或整行 `import type`。写 `import { Foo }` 而 Foo 只是类型，会留下非法运行时 import。
- `allowImportingTsExtensions`：源码 `import './a.ts'`，打包器认得；`tsc` 自己 emit JS 时不能这么玩（所以配 `noEmit`）。

## 2.4 `tsc` 常用命令

```bash
tsc --noEmit          # 只检查
tsc -b                # 按 references 构建
tsc -b --pretty false
# ≥7.0 原生 tsc 额外：
tsc --checkers 8      # 类型检查并行度（默认 4，吃内存）
tsc -b --builders 2   # 多项目并行（和 checkers 相乘，别开太大）
tsc --singleThreaded  # 对比 6/7 或限制 CI 核数
```

和 Babel/esbuild/oxc **同时**转同一份 TS 时：保证不要用 `enum` 这类「tsc 独有 emit」。`erasableSyntaxOnly` 就是卡这个。

## 2.5 第三方：DefinitelyTyped 与 `export =`

老 CJS 库：`import fs = require('fs')` 或 `esModuleInterop`。新代码用 `import fs from 'node:fs'` + `nodenext`/`bundler`。
