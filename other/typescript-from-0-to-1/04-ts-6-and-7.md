# 4. TypeScript 6.0 与 7.0

**6.0：2026-03**，仍是 **JavaScript 实现的编译器**，用来改默认值、扔掉旧选项。  
**7.0：2026-07**，同一套类型逻辑的 **Go 原生移植**（曾用预览包 `@typescript/native-preview`）。

7 不是「新的类型语法大版本」。能干净通过 6.0（且打开 `stableTypeOrdering`、不设 `ignoreDeprecations`）的代码，应按同样结果在 7.0 里过。

## 4.1 6.0 你要做的

- 把 5.x 里靠「没写就 false」活着的项目，改成显式 `strict`（建议 true）。
- `types` 默认空：用到的全局 `@types/*` 写进数组。
- `rootDir` 默认变成 tsconfig 目录：源码在子目录就写 `"rootDir": "./src"`。
- 6 弃用的 compiler flag：在 6 里修掉。7 会直接报错。

语言知识点（联合、泛型、`satisfies`）不用重学。

## 4.2 7.0 你得到的

- 全量 `tsc` 大约 **8–12×**（官方在 vscode/sentry 等仓库上的数量级；核多可加 `--checkers`）。
- 内存往往略降；编辑器从打开文件到第一条红线也快一个数量级。
- 解析 / 检查 / emit 可并行；`tsc -b` 可多项目并行。
- `--watch` 换了监视实现，大 `node_modules` 上更省。

安装：`pnpm add -D typescript@^7` 后工作区里的 `tsc` 就是原生可执行文件（不再是 `node tsc.js`）。编辑器：VS Code 有 **TS 7 专用扩展**；以各编辑器文档为准。

## 4.3 7.0 你暂时没有的

**稳定的编程 API。** `typescript-eslint`、Vue/Svelte/Angular 语言工具等仍要 6.0 的 JS API。官方过渡：

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

这样 `tsc` 走 7，工具 `import 'typescript'` 走 6 的 `tsc6`。**7.1** 计划提供一套新的（不同的）API。

本仓库用 Oxlint 做 JS/TS lint，不跑 typescript-eslint 的 type-aware 规则，升 7 时这块比 Vue SFC 仓库更轻松。

## 4.4 并行参数怎么用

| 旗标 | 作用 | 注意 |
| --- | --- | --- |
| `--checkers N` | 类型检查 worker，默认 **4** | 加大变快、更吃内存；偶发顺序相关结果时固定 N |
| `--builders N` | `tsc --build` 同时建几个 project | 受工程依赖图卡住；与 checkers **相乘** |
| `--singleThreaded` | 全单线程 | 对比 6、调试、小机器 CI |

例：`--checkers 4 --builders 4` 理论上最多 16 个检查器，笔记本/小 CI 别这样开。

## 4.5 和 esbuild / Oxc / swc 的区别

那些是 **转译/打包**，默认不做完整类型检查。7 仍然是 **完整检查** 的 `tsc`，只是实现从 JS 换成 Go，用来填「检查太慢所以大家只在 CI 跑 tsc」的坑。

Vite 8 生产照样用 Oxc/Rolldown 出 JS；`pnpm typecheck` 仍应跑 `tsc`（5、6 或 7）。
