# 1. 配置与本仓库

## 1.1 命令

```bash
pnpm format          # 根 package.json → oxfmt
oxfmt --check        # CI 只检查
```

## 1.2 `.oxfmtrc.json`（本仓库实际值）

```json
{
  "ignorePatterns": ["/dist"],
  "tabWidth": 2,
  "endOfLine": "lf",
  "printWidth": 120,
  "proseWrap": "never",
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all"
}
```

键名按 **Prettier** 记即可。`overrides` 可按 glob 改 JSON5 引号等。

## 1.3 和 Prettier / ESLint / Oxlint

| 工具 | 职责 |
| --- | --- |
| Oxfmt / Prettier | 怎么排版 |
| Oxlint / ESLint | 对不对、坑不坑 |
| Stylelint | CSS/SCSS |

不要两个 formatter 同时 formatOnSave。Cursor/VS Code 装 Oxfmt 或把 defaultFormatter 指到一个。

## 1.4 迁徙

从 Prettier 来：把 `.prettierrc` 字段抄进 `.oxfmtrc.json`，跑一次 format，看 git diff 是否只剩边角。再删 Prettier 依赖和 eslint-config-prettier（若已无 ESLint 格式规则）。

本仓库已经完成这一步：`format` 脚本是 oxfmt，根 devDependencies 没有 prettier。
