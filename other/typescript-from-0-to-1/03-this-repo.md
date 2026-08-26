# 3. 本仓库的 TypeScript

根 `package.json`：**`typescript: ~5.9.3`**（仍是 JS 版 `tsc`）。共享配置在 `packages/ts-config/`。

笔记按 **7.x 主线** 写；**本仓库还没升 6/7**。本仓库已经显式开了 `strict`、`module: ESNext`、`noUncheckedSideEffectImports`，和 6/7 新默认大部分对齐，升 6 时重点核对 `types` / `rootDir` 以及 6 的弃用列表。

## 3.1 `tsconfig.base.json`（摘）

- `target` / `module`: `ESNext`
- `moduleResolution`: **`bundler`（≥5.0）**
- `allowImportingTsExtensions`: true
- `verbatimModuleSyntax`: true → 类型用 `import type`
- `erasableSyntaxOnly`: true（**≥5.8**）→ 不要 `enum` / `namespace` / constructor 参数属性
- `noEmit`: true
- `strict`: true
- `jsx` 在 frontend 配置里：`react-jsx`（React **≥17** 新运行时）

## 3.2 实践约定

1. 组件 props 用 `type`/`interface`，不要 `React.FC` 硬套。
2. 从 `@packages/openapi` 生成的 SDK 已经是 TS，不要再 `any` 包一层。
3. 只在真正逃逸时用 `as`，优先收窄。
4. 别名 `@` 改 tsconfig **和** `vite.config.ts` 的 `resolve.alias`。
5. `pnpm typecheck` → turbo 跑各 app 的 `tsc -b --noEmit`。

## 3.3 以后若升 7

1. 先升 **6.0**，看弃用警告，不要用 `ignoreDeprecations` 混过 7。
2. 确认 `types` 里写了 `@types/node`、`vite/client` 等全局。
3. `tsc -b` 可试 `--builders`；CI 核少时 `--checkers 1` 或 `--singleThreaded`。
4. 在 7.1 提供新 API 之前，eslint / 需要 `typescript` 包 API 的工具继续走 **6**（`@typescript/typescript6`）。本仓库 lint 是 Oxlint，不依赖 TS compiler API，这一条压力较小。
