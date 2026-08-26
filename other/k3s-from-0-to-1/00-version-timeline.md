# 0. k3s 版本时间线

k3s **不维护一套独立的编排 API**。每个 k3s 发行版绑定一个 **上游 Kubernetes patch**，再打自有补丁（containerd、Traefik、etcd 等）。

## 项目节点

| 时间 | 事件 |
| --- | --- |
| **2019-02** | Rancher 发布 k3s：单二进制、ARM 友好、边缘场景 |
| 之后 | 每个上游 minor 对应 k3s 的 `release-1.xx` 分支 |
| 2020+ | Rancher 并入 SUSE；k3s 仍开源（Apache 2.0） |
| 并行产品 | **RKE2**：同门、更偏合规/加固，组件比 k3s 重 |

## 版本号怎么读

```text
v1.34.10+k3s1
 │  │  │    └─ k3s 自己的发行序号（同一 k8s patch 可 +k3s1、+k3s2）
 │  │  └── 上游 patch
 │  └──── 上游 minor（与 kubernetes 1.34 同源）
 └────── 固定前缀 v
```

升级 k3s ≈ 升级 **绑定的那一版 kube-apiserver**。跳 minor 的规则与上游一样：**一次一个 minor**（1.34 → 1.35 → 1.36）。

## 2026-08 附近的发行线（会变，以 GitHub Releases 为准）

| k3s tag 例 | 上游 | 备注 |
| --- | --- | --- |
| `v1.36.x+k3s1` | 1.36 | 最新 minor |
| `v1.35.x+k3s1` | 1.35 | 维护中 |
| `v1.34.10+k3s1` | 1.34 | 仍常见；注意 Traefik chart 大版本可能破坏 Ingress 注解 |
| `v1.33.13+k3s2` | 1.33 | 上游已 **EOL（2026-06）**，不要新开集群 |

嵌入组件随 tag 变。`v1.34.10+k3s1` 当时大致是：containerd **2.2.x**、etcd **3.6.x**、Traefik **3.7.x**、Flannel、CoreDNS、metrics-server、Kine。以该 tag 的 *Embedded Component Versions* 表为准。

## 和「装 Docker Desktop 自带 k8s」的差别

| | k3s | Desktop / kind |
| --- | --- | --- |
| 目标 | 真服务器、边缘、CI 里的小集群 | 笔记本点一下 |
| 运行时 | 自带 containerd | 各不相同 |
| 默认 Ingress | **Traefik** | 经常要自己装 |
| 默认存储 | local-path | kind 有 hostpath；Desktop 看发行 |

k3d 是「用 Docker 容器跑 k3s 节点」，方便在 Mac 上练，生产仍建议 Linux 主机上的 k3s。
