# Kubernetes 从 0 到 1

**定位：** 在多台机器上 **声明式** 跑容器：要几个副本、怎么暴露服务、挂哪块盘、挂了谁重启。本仓库 **没有** k8s 清单；生产前端镜像见 [Docker 笔记](../docker-from-0-to-1/)。本机/边缘单节点常用发行版是 [k3s](../k3s-from-0-to-1/)（API 与这里相同）。

官方：[kubernetes.io](https://kubernetes.io/) · [发行版与支持窗口](https://kubernetes.io/releases/)

当前（2026-08）：上游同时维护 **1.36 / 1.35 / 1.34** 三条 minor。大约 **每年 3 个 minor**，每个 minor 补丁支持约 **14 个月**。不要把「教程里的 1.21 YAML」直接丢到 1.36。

## 怎么读

| 顺序 | 文档 | 版本基线 |
| --- | --- | --- |
| 0 | [版本时间线](./00-version-timeline.md) | 1.0 → **1.36**；dockershim 移除 **1.24** |
| 1 | [对象模型](./01-concepts.md) | Pod / 控制器 / 声明式 API |
| 2 | [工作负载与流量](./02-workloads-and-network.md) | `apps/v1`、`networking.k8s.io/v1` |
| 3 | [和本仓库](./03-this-repo.md) | 镜像已有，集群侧尚未落地 |

最短路径：Pod 是最小调度单位 → 永远不要手搓长期 Pod，用 **Deployment** → Service 给稳定 DNS → 对外用 Ingress 或 Gateway API → 运行时是 **containerd**，不是 Docker Engine。
