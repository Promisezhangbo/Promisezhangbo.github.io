# other

与主站运行时无关的本地工具和学习笔记。框架/语言/工具链均按「从 0 到 1 + 版本标注」。

## 工具链怎么拼（先看这张图）

```
源码 TS/TSX
    ├─ tsc --noEmit          类型（TypeScript）
    ├─ oxlint                质量（ESLint 的快实现）
    ├─ oxfmt                 格式（Prettier 的快实现）
    └─ Vite 8
           ├─ 开发：ESM + Oxc 转译
           └─ 生产：Rolldown 打包
                    （Rollup 的 Rust 实现；2–7 曾用 Rollup + esbuild）

库打包（本仓库暂无）：tsup（esbuild）或 Rollup / tsdown
老应用：webpack
```

本 monorepo 实际在用：**TS 5.9**（主线笔记已写到 **7.0**）、Vite 8、Rolldown、Oxlint、Oxfmt。webpack / Rollup CLI / tsup / ESLint / Prettier 是为了读生态和老项目。

容器与编排（本仓库用 Docker 打前端镜像；上腾讯云机器走 CVM + `docker run`，没有 k8s 清单）：

```
Dockerfile / Dockerfile.cvm → OCI 镜像
                ↓
         TCR（或其他镜像仓库）
                ↓
     腾讯云 CVM：docker run          单机（见 docs/tencent-cvm-docker.md）
     k3s 或 Kubernetes               多副本；节点是 containerd（≥1.24）
```

## 目录

| 目录 | 说明 |
| --- | --- |
| [self_check/](./self_check/README.md) | 本机卡顿自检 |
| [showMD/](./showMD/README.md) | 本地 Markdown 编辑器（**Tauri 2 + React**，`pnpm tauri dev`） |
| [reactjs-from-0-to-1/](./reactjs-from-0-to-1/README.md) | React |
| [vue2-from-0-to-1/](./vue2-from-0-to-1/README.md) | Vue 2 |
| [vue3-from-0-to-1/](./vue3-from-0-to-1/README.md) | Vue 3 |
| [typescript-from-0-to-1/](./typescript-from-0-to-1/README.md) | TypeScript（笔记到 **7.0**；仓库锁 5.9） |
| [webpack-from-0-to-1/](./webpack-from-0-to-1/README.md) | webpack 4/5 |
| [vite-from-0-to-1/](./vite-from-0-to-1/README.md) | Vite **8** |
| [rollup-from-0-to-1/](./rollup-from-0-to-1/README.md) | Rollup（库 / Vite≤7 生产） |
| [tsup-from-0-to-1/](./tsup-from-0-to-1/README.md) | tsup（esbuild 打库） |
| [rolldown-from-0-to-1/](./rolldown-from-0-to-1/README.md) | Rolldown（Vite 8 默认打包器） |
| [eslint-from-0-to-1/](./eslint-from-0-to-1/README.md) | ESLint 8/9 |
| [prettier-from-0-to-1/](./prettier-from-0-to-1/README.md) | Prettier 2/3 |
| [oxlint-from-0-to-1/](./oxlint-from-0-to-1/README.md) | Oxlint **1.57** |
| [oxfmt-from-0-to-1/](./oxfmt-from-0-to-1/README.md) | Oxfmt **0.42** |
| [docker-from-0-to-1/](./docker-from-0-to-1/README.md) | Docker Engine **29**（上腾讯云见 [docs/tencent-cvm-docker.md](../docs/tencent-cvm-docker.md)） |
| [kubernetes-from-0-to-1/](./kubernetes-from-0-to-1/README.md) | Kubernetes **1.36** |
| [k3s-from-0-to-1/](./k3s-from-0-to-1/README.md) | k3s（跟 k8s minor，如 **1.36.x+k3s1**） |
