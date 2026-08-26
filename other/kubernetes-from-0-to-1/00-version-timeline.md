# 0. Kubernetes 版本时间线

项目 2014 年由 Google 开源，**1.0 在 2015-07**。之后约每四个月一个 minor。API 按 **组/版本** 独立弃用，这是踩坑第一来源。

## 上游 minor（够用的节点）

| 版本 | 时间 | 一句话 |
| --- | --- | --- |
| **1.0** | 2015-07 | 生产承诺；ReplicationController + Service |
| 1.2 | 2016 | **Deployment** 进入主线（当时还在 extensions） |
| **1.9** | 2018 | `apps/v1` 稳定（Deployment / DaemonSet / StatefulSet / ReplicaSet） |
| **1.16** | 2019 | **去掉** `extensions/v1beta1` 的 Deployment 等；旧 YAML 直接废 |
| **1.19** | 2020 | Ingress `networking.k8s.io/v1` |
| **1.20** | 2020 | **dockershim 弃用** |
| **1.22** | 2021 | **去掉** Ingress `v1beta1` / `extensions/v1beta1` |
| **1.24** | 2022-05 | **kubelet 移除 dockershim**；必须 CRI（containerd / CRI-O 等） |
| **1.25** | 2022 | 去掉 PodSecurityPolicy；**Pod Security Admission** 稳定 |
| 1.26 | 2023 | HPA 走 `autoscaling/v2` |
| 1.28–1.29 | 2023–2024 | 原生 sidecar（init + `restartPolicy: Always`）从 alpha/beta 走起 |
| **1.33** | 2025-04 | sidecar 容器 **GA**（以发行说明为准） |
| **1.34** | 2025-08 | 本稿时仍在维护窗口内（active 于 2026-08-27 截止） |
| **1.35** | 2025-12 | 维护中 |
| **1.36** | 2026-04 | **最新 minor**（2026-08 补丁如 1.36.4） |

1.33 已于 **2026-06-28 EOL**。选发行版时看云厂商/k3s 跟到哪条线，不要只看「最新 tag」。

## 运行时：Docker 在集群里的位置

```text
kubelet  --CRI-->  containerd / CRI-O  --OCI-->  runc  -->  容器进程
                      ↑
                 Docker 打的 OCI 镜像仍然能跑
```

**1.20** 弃用、**1.24** 删除的是 kubelet 里的 **dockershim**（把 Docker Engine 假装成 CRI 的那层胶水），不是「不能用 Docker 打镜像」。节点上继续装 Docker Engine 也可以，但要通过 **cri-dockerd** 或干脆改 containerd——k3s 默认就是 containerd。

## API 弃用对照（写 YAML 必看）

| 资源 | 现在写 | 不要再写 | 去掉的版本 |
| --- | --- | --- | --- |
| Deployment 等 | `apps/v1`（**≥1.9**） | `extensions/v1beta1`、`apps/v1beta*` | **1.16** |
| Ingress | `networking.k8s.io/v1`（**≥1.19**） | `v1beta1` | **1.22** |
| CronJob | `batch/v1` | `batch/v1beta1` | **1.25** |
| PDB | `policy/v1` | `policy/v1beta1` | **1.25** |
| HPA | `autoscaling/v2` | `v2beta2` | **1.26** |

`kubectl api-versions` 看当前集群还 serve 什么。新集群对旧 `apiVersion` 的报错是 `no matches for kind`，改组名而不是改镜像。

## 支持策略

最近 **3 个 minor** 收补丁。升级一次跳不超过 **1 个 minor**（1.34 → 1.35 → 1.36，不要 1.34 直接 1.36）。发行版（EKS/GKE/AKS/k3s）会再滞后或多打补丁，以发行版说明为准。
