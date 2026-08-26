# 1. 对象模型

Kubernetes 把集群状态存在 **etcd**（k3s 默认可换成 SQLite），你用 YAML/JSON 声明「想要什么」，控制器把现状掰成想要的样子。核心动词：`kubectl apply`。

## 1.1 控制面 vs 数据面

| 组件 | 干什么 |
| --- | --- |
| **kube-apiserver** | 唯一对外 API；认证、鉴权、准入 |
| **etcd** | 状态存储 |
| **scheduler** | 给 Pod 选 Node |
| **controller-manager** | Deployment、Node、Job 等一堆控制循环 |
| **kubelet** | 每个节点：按 PodSpec 调 CRI 跑容器 |
| **kube-proxy** 或替代 CNI datapath | Service 的集群内转发 |

托管 k8s（EKS 等）把控制面藏起来，你只管 Node 和工作负载。k3s 把上面打成 **一个二进制**，见 [k3s](../k3s-from-0-to-1/)。

## 1.2 必懂的对象

**Namespace**：名字隔离。默认 `default`；系统在 `kube-system`。

**Pod**：最小调度单位。一个 Pod 里一个或多个 **共享网络命名空间** 的容器（同一 `localhost`、同一 IP）。前端 nginx 镜像通常 **一容器一 Pod**。

**ReplicaSet**：保证 N 个相同 Pod。几乎不直接写，由 Deployment 管。

**Deployment**（`apps/v1`）：无状态应用的默认控制器——滚动更新、回滚、副本数。

**Service**：给一组 Pod 一个稳定的 **ClusterIP + DNS**（`my-svc.my-ns.svc.cluster.local`）。Pod IP 会变，Service 用 label selector 找后端。

**Ingress / Gateway**：把 HTTP(S) 从集群外打到 Service。Ingress 是老接口；**Gateway API** 是独立 SIG 的后继（1.0 GA 于 **2023-10**，和 k8s minor 解耦）。

**ConfigMap / Secret**：配置和敏感配置。挂成环境变量或文件。Secret 默认只是 base64，不是加密；生产要加密 at rest + RBAC。

**PVC / StorageClass**：声明要一块盘；Provisioner 去云盘或本地目录真正创建。k3s 自带 local-path。

**Node**：机器。你一般不创建 Node，kubelet 注册上来。

## 1.3 声明式 vs 命令式

```bash
# 命令式（演示可以，GitOps 不要）
kubectl run web --image=nginx

# 声明式（清单进 Git）
kubectl apply -f deploy.yaml
```

清单里永远带：`apiVersion`、`kind`、`metadata.name`，工作负载再加 `spec`。label 用来关联：Deployment 的 `selector` 必须匹配模板上的 labels，且 **创建后不可改**（`apps/v1` 起）。

## 1.4 探针与资源

容器要写：

- `resources.requests/limits`：调度按 request；limit 防一个进程吃光节点。
- `livenessProbe`：死了重启容器。
- `readinessProbe`：没就绪就从 Service 摘掉。
- `startupProbe`（**≥1.16** 进主线、后续稳定）：慢启动不要被 liveness 误杀。

前端静态 nginx：readiness 探 `httpGet` `/` 即可；没必要复杂 liveness。

## 1.5 RBAC 与 kubeconfig

`kubectl` 读 `~/.kube/config`（多集群用 `context`）。集群内进程用 **ServiceAccount** + Role/ClusterRoleBinding。不要把管理员 kubeconfig 打进前端镜像。
