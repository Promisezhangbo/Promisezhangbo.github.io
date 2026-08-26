# Docker 从 0 到 1

**定位：** 把应用打成 **镜像**、在本机/CI 里 **跑容器**。本仓库根目录有 `Dockerfile`：多阶段构建前端静态资源，再用 nginx 提供 SPA。集群里真正拉起容器的通常是 **containerd**（k8s / k3s），不一定再经过 Docker Engine。

官方：[docs.docker.com](https://docs.docker.com/) · Engine 发行说明 [28](https://docs.docker.com/engine/release-notes/28/) / [29](https://docs.docker.com/engine/release-notes/29/)

当前主线（2026-08）：**Docker Engine 29.x**（29.0 起于 **2025-11**）。很多 Linux 发行版包、旧文档仍写 24–28，概念通用。

## 怎么读

| 顺序 | 文档 | 版本基线 |
| --- | --- | --- |
| 0 | [版本时间线](./00-version-timeline.md) | 1.0 → **29** |
| 1 | [镜像、容器、网络、存储](./01-concepts.md) | 全程；BuildKit **≥18.09**、默认 **≥23** |
| 2 | [Dockerfile 与 Compose](./02-dockerfile-and-compose.md) | 多阶段 **≥17.05**；`docker compose` **V2** |
| 3 | [和本仓库](./03-this-repo.md) | 根 `Dockerfile` + nginx；腾讯云整站用 `Dockerfile.cvm` |

最短路径：镜像 ≠ 容器 → `Dockerfile` 多阶段 → `docker compose` 起依赖 → 知道 **k8s 不需要 Docker Engine**（**1.24** 去掉 dockershim）。

上腾讯云 CVM：**整站**用 [`Dockerfile.cvm`](../../Dockerfile.cvm)，步骤见 [docs/tencent-cvm-docker.md](../../docs/tencent-cvm-docker.md)。根 `Dockerfile` 是单应用/Render 布局，和生产 `/main/`、`/login/` 对不上。

## 和 k8s / k3s

```
Dockerfile / docker build     → OCI 镜像
        │
        ├─ Docker Engine          本机开发、CI 构建（本仓库这条）
        └─ containerd / CRI-O     k8s、k3s 节点上跑 Pod（≥1.24 默认不再走 Docker）
```

继续：[Kubernetes](../kubernetes-from-0-to-1/) · [k3s](../k3s-from-0-to-1/)
