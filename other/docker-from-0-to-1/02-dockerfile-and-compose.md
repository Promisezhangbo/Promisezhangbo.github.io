# 2. Dockerfile 与 Compose

## 2.1 Dockerfile 指令

按执行顺序记：

| 指令 | 作用 |
| --- | --- |
| `FROM` | 基础镜像；多阶段可写多次 |
| `WORKDIR` | 后续命令的当前目录 |
| `ARG` | 构建参数，**不会**自动进运行时环境 |
| `ENV` | 镜像内环境变量，运行时还在 |
| `COPY` / `ADD` | `COPY` 更可预期；`ADD` 会解包远程 URL（少用） |
| `RUN` | 构建时执行（安装依赖、编译） |
| `EXPOSE` | 文档性端口，**不会**真的发布端口 |
| `CMD` | 容器默认命令（可被 `docker run` 覆盖） |
| `ENTRYPOINT` | 固定入口；常和 `CMD` 搭配当默认参数 |
| `HEALTHCHECK` | **≥1.12** 探活 |
| `USER` | 之后进程的用户 |

`CMD` 写成 **exec 数组** `["nginx", "-g", "daemon off;"]`，不要靠 shell，信号才能传到进程。

## 2.2 多阶段构建（≥17.05）

编译器和运行时拆开，最终镜像不含 `node_modules`、编译器：

```dockerfile
FROM node:20-bookworm-slim AS builder
# … install & build …

FROM nginx:alpine
COPY --from=builder /repo/dist/main /usr/share/nginx/html
```

`--from=` 可以是前面的 `AS` 名，也可以是别的镜像。

## 2.3 BuildKit（可选 ≥18.09，默认 ≥23）

打开后才有：

```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=cache,target=/root/.local/share/pnpm \
    pnpm install --frozen-lockfile
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    pnpm install
```

`docker buildx build` 可做多架构（`linux/amd64,linux/arm64`）和把镜像直接推仓库。

旧 builder 对 `RUN --mount` 会报语法错：先确认 `docker buildx version`，Desktop 默认已是 BuildKit。

## 2.4 Compose：本机多容器

一个 YAML 描述 web + db + redis，替代一长串 `docker run`。

命令用 **空格**：`docker compose up -d`（Compose **V2+**）。带连字符的 `docker-compose` 是 **V1**，**2023-07** 停更。

最小例子：

```yaml
services:
  web:
    build: .
    ports:
      - "8080:80"
    environment:
      PORT: "80"
  api:
    image: ghcr.io/example/api:1.2.3
    depends_on:
      - web
```

要点：

- 同一 compose 项目里，服务名可当主机名（`http://api:3000`）。
- `ports` 才映射到宿主机；服务之间用 **容器端口** 互访即可。
- 生产集群（k8s/k3s）**一般不跑 Compose**；Compose 是开发/单机。把同一套镜像用 Deployment/Service 再描述一遍。
- Compose 文件版本字段 `version: "3.8"` 在新 spec 里已弱化，新项目可以不写。

## 2.5 镜像仓库

`docker push` / `docker pull` 默认 Docker Hub。公司常用 GHCR、Harbor、云厂商 ACR/ECR。k8s 拉私有镜像要 `imagePullSecrets`。

tag 约定：`registry/org/name:git-sha`。`:latest` 在集群里会被缓存策略坑到「以为更新了其实没有」。
