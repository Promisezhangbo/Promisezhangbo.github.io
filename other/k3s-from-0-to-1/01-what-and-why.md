# 1. 相对上游精简了什么

k3s 通过 **CNCF 认证**，`kubectl`、Deployment、Service、CRD 与上游一致。精简的是 **发行方式** 和 **默认插件**，不是删掉 Pod 模型。

## 1.1 一个二进制里有什么

传统 kubeadm：apiserver、scheduler、controller-manager、etcd、kubelet、kube-proxy 多个进程 + 一堆静态 Pod。

k3s server 进程把控制面捆在一起；agent 跑 kubelet + 容器运行时。安装脚本再拉镜像跑 Flannel、CoreDNS、Traefik、metrics-server、local-path-provisioner 等。

## 1.2 默认组件对照

| 能力 | 上游常见做法 | k3s 默认 |
| --- | --- | --- |
| 数据存储 | etcd 集群 | **SQLite**（经 **Kine**）；`--cluster-init` 多节点才用嵌入 etcd |
| 容器运行时 | 自装 containerd / CRI-O | **自带 containerd**（不是 Docker Engine） |
| CNI | 自选 Calico/Cilium… | **Flannel** |
| 集群 DNS | 自装 CoreDNS | 自带 CoreDNS |
| Ingress | 自装 | **Traefik** |
| 动态存储 | 云 CSI | **local-path-provisioner**（节点本地目录） |
| Helm | 集群外 `helm` CLI | **helm-controller**：可 apply `HelmChart` CRD |
| 云控制器 | CCM | 默认无云厂商 CCM |

`--disable traefik`、`--disable servicelb` 等可拆掉默认项，自己换 ingress-nginx / Cilium。

## 1.3 Kine + SQLite 的含义

单节点开发、边缘盒子：没有 etcd 运维负担，重启也简单。

限制：SQLite **不是** 高可用控制面。多 server 要嵌入 etcd 或外置 datastore（Kine 也可对 MySQL/Postgres）。生产多节点先读官方 HA 文档，不要假设「装了两台 k3s 就自动主备」。

## 1.4 刻意没有的

- 上游部分 **in-tree 云存储/云负载均衡** 驱动（改走 CSI/外部 CCM）
- 默认 **dockershim / Docker Engine**（与 k8s **≥1.24** 同一方向）
- 完整发行版里那些很少用的 addon

镜像仍然是 OCI：本仓库 `docker build` 的 nginx 镜像可以直接给 k3s 用。

## 1.5 和同类发行版

| 发行版 | 一句话 |
| --- | --- |
| **k3s** | 轻、单二进制、边缘/单机首选 |
| **RKE2** | 同门，默认更偏 CIS/加固 |
| kubeadm / 云托管 | 标准上游或厂商控制面；插件自己选 |
| microk8s | Canonical，snap 包 |
| minikube / kind | 本机学习；kind 用 Docker 套上游节点 |

YAML 可移植：在 k3s 上 apply 通过的 Deployment，换 EKS 通常只要改 IngressClass、StorageClass、镜像仓库。
