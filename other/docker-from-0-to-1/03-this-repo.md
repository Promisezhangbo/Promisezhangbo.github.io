# 3. 和本仓库

本仓库是前端 monorepo，**用 Docker 只做生产镜像**，开发仍是本机 Node + Vite。没有 `docker-compose.yml`，也没有 k8s 清单。

## 3.1 根目录 `Dockerfile`

两阶段：

1. **builder**：`node:20-bookworm-slim`，`corepack` 启用 **pnpm@10.13.1**（对齐 `packageManager`），拷 lockfile → `pnpm install --frozen-lockfile` → `pnpm exec turbo run build --filter=${APP}`。
2. **runtime**：`nginx:alpine`，把 `/repo/dist/${APP}` 拷到 html 目录。`nginx.conf.template` 用 `envsubst` 把 **`${PORT}`** 写进 `listen`（适配 Render 一类平台注入端口）。

构建参数：

```bash
docker build --build-arg APP=main -t private-main:dev .
```

`APP` 默认 `main`。SPA 刷新靠模板里 `try_files … /index.html`。

## 3.2 为什么运行时不是 Node

浏览器要的是静态 JS/CSS/HTML。Node 只在 **构建机** 需要。最终镜像小、无 `pnpm`、无源码，攻击面也小。这是前端镜像的常规拆法。

## 3.3 和 Vite / Turbo 的关系

镜像 **不跑** `vite dev`。构建命令与 CI/本机 `turbo run build` 同一条路径，保证本地能编过的，镜像里也能编过。OpenAPI 生成等依赖 Turbo 的 `^generate`，所以注释写明不要绕过 Turbo 只跑单个 app 的 `build`。

## 3.4 腾讯云机器（整站）

qiankun 生产 `base` 是 `/main/`、`/login/` 等，发布物是整棵 `dist/`（与 Pages / Netlify 相同）。根 `Dockerfile` 只拷 `dist/${APP}` 到站点根，**不能**当整站镜像。

整站用 [`Dockerfile.cvm`](../../Dockerfile.cvm)：`pnpm run build` + `postbuild`，拷贝 `/repo/dist`。推 TCR、CVM 上 `-e PORT=80 -p 80:80` 的步骤见 **[docs/tencent-cvm-docker.md](../../docs/tencent-cvm-docker.md)**。

## 3.5 下一步若要上集群

1. 把镜像推到仓库（带不可变 tag）。
2. k3s / k8s 里用 Deployment + Service；入口用 Traefik（k3s 默认）或 Ingress / Gateway API。见 [kubernetes](../kubernetes-from-0-to-1/) 与 [k3s](../k3s-from-0-to-1/)。
3. 集群节点 **不必装 Docker**；装 containerd 即可。本机继续用 Docker/Desktop 只负责 `build`/`push`。
