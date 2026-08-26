# 1. 用法与分工

## 1.1 哲学

Prettier 几乎不提供「风格之争」开关。常见可配的只有：

| 选项 | 常见值 | 本仓库 Oxfmt |
| --- | --- | --- |
| `printWidth` | 80/100/120 | 120 |
| `tabWidth` | 2 | 2 |
| `semi` | true | true |
| `singleQuote` | true | true |
| `trailingComma` | all（3 默认） | all |
| `endOfLine` | lf | lf |
| `arrowParens` | always | （Ox 跟 Prettier 默认） |

争论「要不要分号」没有技术意义，**锁死 + CI 检查** 即可。

## 1.2 命令

```bash
npx prettier --write .
npx prettier --check src   # CI：有未格式化则非 0
```

忽略：`.prettierignore`（`dist`、`pnpm-lock.yaml`）。

## 1.3 和 ESLint

- Prettier：空白、换行、引号
- ESLint：对错、hooks、未使用变量

用 `eslint-config-prettier` **关掉 ESLint 的格式规则**。不要两个都开 `indent`。编辑器：保存时只跑一个 format，lint 另说。

## 1.4 编辑器

VS Code / Cursor：`esbenp.prettier-vscode` + `"editor.defaultFormatter"`。本仓库若已装 Oxfmt 扩展，不要两个保存都格式化。

## 1.5 本仓库

`pnpm format` → **oxfmt**。`.oxfmtrc.json` 里的键几乎就是 Prettier 那套（`printWidth` `semi` `singleQuote`…）。从 Prettier 迁过来成本很低。
