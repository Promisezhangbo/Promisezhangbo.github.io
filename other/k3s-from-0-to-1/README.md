# k3s 从 0 到 1

**定位：** Rancher/SUSE 的 **轻量 Kubernetes 发行版**——Certified Kubernetes，API 与上游 **同一套**。差别在打包：一个二进制、默认 SQLite、自带 Traefik / Flannel / containerd。适合单机、边缘、开发；不是「另一种编排语法」。

官方：[docs.k3s.io](https://docs.k3s.io/) · 版本号跟上游：`v1.36.x+k3s1`

当前（2026-08）k3s 发行为例：`v1.36.3+k3s1`、`v1.35.7+k3s1`、`v1.34.10+k3s1`。选 minor 时对齐 [k8s 支持窗口](../kubernetes-from-0-to-1/00-version-timeline.md)。

## 怎么读

| 顺序 | 文档 | 版本基线 |
| --- | --- | --- |
| 0 | [版本时间线](./00-version-timeline.md) | 2019 → 跟 k8s **1.36** |
| 1 | [相对上游精简了什么](./01-what-and-why.md) | 组件对照 |
| 2 | [安装与日常](./02-install-and-ops.md) | Linux 安装；Mac 用 k3d |
| 3 | [和本仓库](./03-this-repo.md) | 先有镜像，再 apply YAML |

最短路径：k3s **就是** k8s → 默认 SQLite + Traefik + containerd → Mac 上用 **k3d** 或 Linux 虚机 → 工作负载 YAML 与 [Kubernetes 笔记](../kubernetes-from-0-to-1/) 相同。
