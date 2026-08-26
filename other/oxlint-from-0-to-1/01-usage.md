# 1. 配置与本仓库

## 1.1 CLI

```bash
pnpm oxlint
pnpm oxlint --fix
# 本仓库
pnpm lint          # turbo filter apps
```

## 1.2 `.oxlintrc.json`

各 app 一份（见 `apps/main/.oxlintrc.json`）。常见字段：

- `categories` / `plugins`：开 React、typescript、unicorn 等内置插件集（以当前文档为准，1.x 字段还在变）
- `rules`：`"no-console": "warn"`
- `ignorePatterns`：对齐 dist、生成代码

规则 id 可查 [oxc linter rules](https://oxc.rs/docs/guide/usage/linter/rules.html)。从 ESLint 迁：先开 recommended，再把红的一条条对名字。

## 1.3 React / TS

开 React 插件后，hooks 规则（`exhaustive-deps` 的子集）会在。和 `eslint-plugin-react-hooks` 不是 100% 逐条等价，升级 Oxlint 时看 changelog。

TS：走 Oxc 的 TS 解析，不必 `@typescript-eslint/parser`。深度「基于类型信息」的规则仍可能弱于 `typescript-eslint` 的 type-checked 套件。

## 1.4 lint-staged

`.lintstagedrc.mjs` 里 JS/TS 变更触发 `pnpm lint`（turbo，不把文件列表传进 oxlint 的原因见文件注释）。提交前会全 app 扫，所以要快——这是选 Oxlint 的原因。

## 1.5 实践

1. 能配规则就不要关整个插件。
2. 生成代码（openapi `gen/`）忽略。
3. `--fix` 能修的修；格式不要指望 lint，用 oxfmt。
4. 升级 `oxlint` 次版本可能新增规则变红，看 diff 再决定是改代码还是改配置。
