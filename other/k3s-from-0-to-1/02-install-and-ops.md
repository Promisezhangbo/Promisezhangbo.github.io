# 2. 安装与日常

k3s **只支持 Linux**。本机是 macOS 时：开 Linux 虚机、云主机，或用 **k3d**（Docker 里套 k3s）。

## 2.1 Linux 单节点

```bash
curl -sfL https://get.k3s.io | sh -
# 指定上游 minor 对应的 k3s 通道，例如：
# curl -sfL https://get.k3s.io | INSTALL_K3S_CHANNEL=v1.36 sh -
```

- kubeconfig：`/etc/rancher/k3s/k3s.yaml`（root 可读）。拷到 `~/.kube/config` 或设 `KUBECONFIG`。
- 客户端：`k3s kubectl get nodes`，或系统自带的 `kubectl`。
- 默认已能 `get pods -A` 看到 CoreDNS、Traefik、local-path 等。

agent（工作节点）加入：

```bash
curl -sfL https://get.k3s.io | K3S_URL=https://<server-ip>:6443 K3S_TOKEN=<token> sh -
```

token 在 server 的 `/var/lib/rancher/k3s/server/node-token`。

## 2.2 常用安装参数

| 需求 | 做法 |
| --- | --- |
| 不要默认 Traefik | `INSTALL_K3S_EXEC="--disable traefik"` |
| 不要 ServiceLB | `--disable servicelb` |
| 多网卡指定 IP | `--node-ip` / `--advertise-address` |
| 私有镜像仓库 | `registries.yaml`（k3s 文档 mirrors / configs） |
| 写 kubeconfig 给非 root | 改文件权限或复制后 `chown` |

升级：再跑一次安装脚本（同 channel）或包管理器；**不要跳 minor**。etcd 大版本（如 3.5 → 3.6）以该次 k3s release note 为准。

## 2.3 Mac：k3d

先有 Docker Engine（Desktop / Colima / OrbStack），再：

```bash
k3d cluster create dev --agents 1
kubectl get nodes
```

得到的仍是 k3s API。端口映射、Ingress 在 k3d 里要额外 `--port` 把 80/443 打到宿主机。删集群：`k3d cluster delete dev`。

## 2.4 部署一个前端镜像

和上游相同：

```bash
kubectl create deployment web --image=registry.example.com/private-main:abc1234
kubectl expose deployment web --port=80
kubectl apply -f ingress.yaml   # IngressClass 用 traefik
```

Traefik 在 k3s 里通常 watch Ingress。Host 要指向节点 IP 或 `k3d` 映射的 localhost。TLS 用 cert-manager 或 Traefik 自己的证书 CRD。

HelmChart CRD（k3s 特色）适合集群组件；应用发布用普通 YAML/Helm CLI 即可，不必强行走 helm-controller。

## 2.5 排障入口

```bash
sudo k3s kubectl get pods -A
sudo journalctl -u k3s -f          # server
sudo journalctl -u k3s-agent -f    # agent
```

镜像拉不下来：看 containerd、`registries.yaml`、节点能否访问仓库。Pod `Pending`：看 PVC（local-path 要节点磁盘）和资源 request。

Traefik Helm chart 大版本升级可能改 Ingress provider 名字（例如某次 1.34 线把 `kubernetesIngressNginx` 改成 `kubernetesIngressNGINX`）。升级前读 **该 k3s tag 的 Breaking**，不要只看 k8s changelog。

## 2.6 卸载

官方脚本：`/usr/local/bin/k3s-uninstall.sh`（agent 有对应 uninstall）。会删数据目录，先备份。
