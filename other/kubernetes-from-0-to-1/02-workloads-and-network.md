# 2. 工作负载与流量

## 2.1 Deployment 最小清单

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: nginx
          image: registry.example.com/private-main:abc1234
          ports:
            - containerPort: 80
          readinessProbe:
            httpGet:
              path: /
              port: 80
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
```

滚动更新：改 image tag 再 `kubectl apply`。`kubectl rollout undo deployment/web` 回滚。镜像 tag 用 **不可变 sha**，避免 `:latest` 以为更新了节点却还缓存旧层。

## 2.2 有状态、任务、节点级

| 控制器 | 场景 |
| --- | --- |
| Deployment | 无状态（本仓库前端） |
| StatefulSet | 稳定网络名 + 有序盘（数据库） |
| DaemonSet | 每节点一个（日志、CNI） |
| Job / CronJob | 跑完就停；CronJob 用 `batch/v1`（**≥1.21** 稳定，**1.25** 去掉 beta） |

原生 **sidecar**（同一 Pod 里的辅助容器，随主容器生命周期）：**1.28** 起以 initContainer + `restartPolicy: Always` 推进，**1.33 GA**。老做法是普通多 container Pod，退出顺序靠约定。

## 2.3 Service 类型

| type | 作用 |
| --- | --- |
| ClusterIP | 默认，仅集群内 |
| NodePort | 每节点开高位端口（开发/小集群） |
| LoadBalancer | 云厂商给公网/内网 LB |
| ExternalName | DNS CNAME |

Service 是 **L4**（IP+端口）。HTTP 路径、TLS、按 Host 分流走 Ingress 或 Gateway。

## 2.4 Ingress（`networking.k8s.io/v1`，≥1.19）

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web
spec:
  ingressClassName: traefik   # k3s 默认 Traefik
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix   # v1 必填
            backend:
              service:
                name: web
                port:
                  number: 80
```

相对 `v1beta1`：**1.22** 起旧 API 不再 serve。`spec.backend` → `defaultBackend`；`serviceName`/`servicePort` → `service.name` / `service.port.number`。

Ingress **本身不转发流量**，要装 **Ingress Controller**（Traefik、ingress-nginx、云厂商）。k3s 默认带 Traefik。

## 2.5 Gateway API

Ingress 表达能力不够（多协议、共享网关、角色分离）时用 Gateway API（CRD：`GatewayClass` / `Gateway` / `HTTPRoute` 等）。和 k8s 核心版本解耦，安装的是 CRD + 具体实现（如 Envoy Gateway、Traefik）。新集群对外 HTTP 可以 **直接学 Gateway**，Ingress 仍到处都是。

## 2.6 配置、密钥、盘

- 环境变量来自 ConfigMap/Secret；改 ConfigMap **不会**自动重启 Pod，除非用 checksum 注解触发滚动，或挂文件 + 应用自 reload。
- 前端 nginx 的 `PORT`：本仓库镜像用 `envsubst` 在 **容器启动时** 渲染配置，对应 Pod `env`。
- 静态站点通常 **不需要 PVC**。用户上传、数据库才要。

## 2.7 发布策略

Deployment 默认 RollingUpdate（`maxUnavailable` / `maxSurge` 在 `apps/v1` 默认 25%）。蓝绿/金丝雀用两份 Deployment + Service 切流量，或 Argo Rollouts / Gateway 权重。Helm 是「模板化清单 + 版本仓库」，不是另一种编排 API。
