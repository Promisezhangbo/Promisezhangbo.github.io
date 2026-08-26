# 3. 和本仓库

本 monorepo **不包含** Deployment/Service YAML，也没有 Helm chart。和集群相关的只有：**能打出可调度的 OCI 镜像**。

## 3.1 已经有的

根 [`Dockerfile`](../../Dockerfile) 是单应用布局；**整站**用 [`Dockerfile.cvm`](../../Dockerfile.cvm)（全量 `dist/`，与 Pages 一致）。`PORT` 由运行时注入。上腾讯云单机见 [docs/tencent-cvm-docker.md](../../docs/tencent-cvm-docker.md)；概念见 [Docker · 本仓库](../docker-from-0-to-1/03-this-repo.md)。

上 k8s 时最少还要：

1. 镜像仓库 + 不可变 tag  
2. Deployment（副本、探针、`resources`）  
3. Service（ClusterIP）  
4. Ingress 或 Gateway（Host / TLS）  
5. 若私有仓：`imagePullSecrets`

## 3.2 本仓库不需要的

- 为 Vite HMR 在集群里跑 `vite dev`（开发继续本机）
- 给静态前端挂 PVC
- 在前端镜像里再装 Docker / kubectl
- 把 `dockershim` 或节点上的 Docker Engine 当成前置（**≥1.24** 用 containerd 即可）

## 3.3 本机想练 API

Mac 上不要直接装上游 kubeadm。可选：

| 工具 | 特点 |
| --- | --- |
| **k3s** 在 Linux 虚机 / 云主机 | 最接近「一台服务器上的真集群」 |
| **k3d** | 在 Docker 里跑 k3s 节点 |
| **kind** | 在 Docker 里跑上游 kubeadm 风格节点 |
| Docker Desktop / Rancher Desktop | 勾选 Kubernetes，版本往往落后上游一轮 |

学习清单的 `apiVersion` 以 **你 `kubectl version` 的 server** 为准，不要复制 2019 年的 `extensions/v1beta1`。

下一步若只想单节点少运维：读 [k3s](../k3s-from-0-to-1/)。k3s 的 YAML 和这里完全一样。
