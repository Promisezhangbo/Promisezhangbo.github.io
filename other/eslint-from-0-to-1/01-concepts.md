# 1. 规则、插件、Flat Config

## 1.1 干什么 / 不干什么

ESLint **静态分析** AST：未使用变量、hooks 依赖、`==`、不安全的 `any`（靠 TS 插件）……

**格式**（分号、引号、换行）交给 Prettier/Oxfmt，再用 `eslint-config-prettier` 关掉 ESLint 里的格式规则，避免互殴。

## 1.2 规则三级

`off` / `warn` / `error`。可带选项：`['error', { argsIgnorePattern: '^_' }]`。

核心规则在 ESLint 仓库；更多在 **plugin**（`plugin:react/recommended` 这种 8 写法；9 是显式 `plugins: { react }` + 展开 recommended）。

## 1.3 eslintrc（8，遗留）

```js
// .eslintrc.cjs
module.exports = {
  root: true,
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  rules: { 'no-console': 'warn' },
};
```

级联：子目录 `.eslintrc` 会合并，难调试。9 默认不走这套。

## 1.4 Flat Config（≥9 默认）

一个数组，**从上看下**，后者覆盖前者。无级联魔法。

```js
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { ignores: ['dist/**'] },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: { '@typescript-eslint/no-explicit-any': 'error' },
  },
];
```

`typescript-eslint` v8 提供 parser + 规则，可开 **typed lint**（要打 TS 工程，慢，和 Oxlint 的取舍点）。

## 1.5 常见插件

| 插件 | 用途 |
| --- | --- |
| `eslint-plugin-react` | JSX 实践 |
| `eslint-plugin-react-hooks` | hooks 规则，几乎必开 |
| `eslint-plugin-import` | import 顺序/循环（Oxlint 覆盖不全时还要它） |
| `eslint-plugin-jsx-a11y` | 无障碍 |
| `eslint-plugin-vue` | Vue SFC |

自定义规则：公司规范；Oxlint **不能**跑任意 ESLint 插件，这是还留 ESLint 的理由。

## 1.6 CLI

```bash
npx eslint . --max-warnings 0
npx eslint src --fix
```

`--fix` 只修「安全自动修」的规则，不是格式化全部。

## 1.7 本仓库

根脚本 `pnpm lint` → turbo → 各 app **oxlint**。没有根 `eslint.config.js`。读 Antd/React 文档里的 eslint 配置时，把规则名记下来，再去 `.oxlintrc.json` 里找同名或子集。
