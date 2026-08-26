# 0. Oxlint 版本与边界

Oxlint 跟 **Oxc 解析器** 一起发版，主版本还在 0.x/1.x 快速迭代（本仓库锁定 `^1.57`）。规则集持续从 ESLint/typescript-eslint/react 往里搬。

## 它不是「ESLint 的 Rust 包装」

- 自己实现规则，读的是 Oxc AST
- **不能**加载任意 `eslint-plugin-xxx`
- 规则名尽量与 ESLint 相同，便于迁移

## 何时仍要 ESLint

- 某个插件没有 Ox 实现（很偏的 import 图、自定义公司规则、完整 typed lint）
- 要 `eslint --fix` 的某种自动重构 Ox 还没有

多数 React 仓库（hooks、no-unused、eqeqeq）Oxlint 够用。本仓库选择它就是为了 monorepo lint 速度。

## 和 Oxfmt / Rolldown

同一套解析器：lint、format、打包少 parse 几次。Vite+ 把它们收成一条 `vp check`。本仓库仍是 pnpm 分别调 `oxlint` / `oxfmt`。
