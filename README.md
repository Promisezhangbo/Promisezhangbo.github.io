# 说明文档

## 项目说明

## 项目说明

这是一个基于 pnpm workspaces + Vite 的 monorepo，使用 qiankun 做微前端 (micro-frontend) 的宿主与子应用整合。

本仓库按功能做了公共配置抽离（例如 ESLint/Prettier/TypeScript 配置），并通过 workspace: 方式让子包共享统一规范。

### 仓库结构（简要）

```
/
├─ apps/                # 所有子应用（宿主与微应用）
│  ├─ main/             # 主应用（基座 / host）
│  ├─ agent/            # 子应用示例：agent
│  ├─ blog/             # 子应用示例：blog
│  └─ login/            # 子应用示例：login (singin)
├─ packages/            # 共享配置包（eslint-config / prettier-config / ts-config 等）
├─ dist/                # 构建产物（build output）
├─ .github/             # CI / workflow
├─ .husky/              # git hooks
├─ .vscode/             # 推荐的编辑器设置（可选）
├─ package.json         # 根脚本与 workspace 配置
└─ pnpm-workspace.yaml  # pnpm workspace 列表
```

### 主要脚本（根目录）

在仓库根运行：

```bash
# 启动所有子应用的 dev（并行）
pnpm dev

# 构建所有子应用（并行）
pnpm build

# 格式化代码
pnpm format

# 运行 lint（会遍历各子包）
pnpm lint
```

也可以进入单个应用目录执行：

```bash
cd apps/main && pnpm dev
```

### apps 说明（host / micro-app）

- `apps/main`：主应用（宿主），负责渲染全局菜单、路由、以及 qiankun 的注册与启动。
- `apps/agent`, `apps/blog`, `apps/login`：微应用示例。每个微应用独立运行（vite dev），也能被主应用通过 qiankun 挂载。

请注意开发时 micro-app 的 `entry`（在主应用 `qiankun` 配置中）应与实际 dev 端口一致。

### 关键配置说明

- `packages/eslint-config`：共享 ESLint 配置（建议使用编辑器 ESLint 插件并重启以确保加载）。
- `packages/prettier-config`：共享 Prettier 配置，统一代码风格。
- `packages/ts-config`：共享 TypeScript 基础配置（路径别名等）。

如果你修改了 packages 下的配置，并且通过pnpm workspace:\* 的方式链接到子应用修改 @packages/ts-config 的配置后,子应用便可直接生效，入不生效则运行 `pnpm i` 并重启编辑器 / TS server 以生效。

### 常见问题与调试提示（qiankun 相关）

- Target container not existed：确保主应用在路由对应位置提供了挂载容器（默认 `#sub-app`），并确认主应用 DOM 渲染先于 qiankun 尝试挂载。常见解决方案：
  - 在 `Layout` 中渲染一个持久的 `<div id="sub-app"><div id="root"/></div>`，或将 qiankun 注册/启动时机移到容器就绪后。
  - 确保微应用的 `entry` URL 对应正确的 dev 端口。

- import / runtime 报错（例如 regenerator / CJS/ESM）：在 dev 下可能需要调整 Vite 的 optimizeDeps 或关闭子应用的 HMR 注入（在某些场景下）。

### 编辑器 & CI 建议

- 在 VS Code 中安装并启用 ESLint、Prettier 插件。我们提供 `.vscode` 推荐配置（若存在）来提升体验。若你看到 lint 与编辑器不一致，尝试重载窗口或重启 TypeScript 服务。
- 在 CI 中把 lint 与 typecheck 加入流水线（`pnpm -w -r lint` 和 `pnpm -w -r tsc --noEmit`），以在 PR 时阻止风格/类型回归。

---

有任何目录/脚本的具体使用场景或想把 README 再精简为中文/英文双语说明，我可以继续优化。
