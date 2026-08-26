# 3. 和本仓库

本仓库 **没有** k3s 安装脚本或 HelmChart。关系只有一层：**Docker 打出来的静态 nginx 镜像，可以原样在 k3s 里当 Deployment。**

## 3.1 推荐顺序

1. 本机 `pnpm` / Turbo 能 `build`  
2. 整站：`docker build -f Dockerfile.cvm`（见 [腾讯云 CVM 部署](../../docs/tencent-cvm-docker.md)）；单应用才用根 `Dockerfile --build-arg APP=main`  
3. 镜像推进仓库  
4. 在 k3s 上 apply Deployment + Service + Ingress（YAML 写法见 [Kubernetes](../kubernetes-from-0-to-1/02-workloads-and-network.md)）  
5. IngressClass 填 k3s 默认的 **traefik**（除非你 `--disable traefik` 换了别的）

`PORT`：若集群里容器固定听 80，构建/运行时把 `PORT=80` 配进 Pod env，和 Render 上注入端口是同一机制。

## 3.2 不必做的

- 在 k3s 节点上再装 Docker Engine（已有 containerd）
- 为前端开 local-path PVC
- 把 Vite 开发服务器丢进集群
- 为了「学 k8s」先上完整 kubeadm——API 与 k3s 相同

## 3.3 三套笔记怎么串

```text
本仓库源码
    → Vite / Turbo 构建
    → Docker 多阶段镜像（nginx + SPA）
    → 镜像仓库
    → k3s 或托管 k8s：Deployment / Service / Ingress
```

开发：Mac 上 Node。预发/生产：Linux 上的 k3s 或云 k8s。Mac 上预演集群用 k3d 即可。
