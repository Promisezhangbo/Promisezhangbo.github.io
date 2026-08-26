# 腾讯云机器：Docker 镜像部署前端

本文把本仓库 **整站静态资源**（`dist/`，含 qiankun 主应用 + 子应用）打成镜像，推到 **腾讯云容器镜像服务（TCR）**，在 **CVM / 轻量应用服务器** 上 `docker run`。  
概念见 [Docker 从 0 到 1](../other/docker-from-0-to-1/)；集群编排见 [k3s](../other/k3s-from-0-to-1/) / [Kubernetes](../other/kubernetes-from-0-to-1/)。

当前线上默认仍是 [GitHub Pages](./github-pages-deploy.md) / [Netlify](./netlify-deploy.md)（直接发布 `dist/`）。本条路径等价于：**同一份 `dist/`，换成 nginx 容器跑在你自己的机器上。**

## 和现有 `Dockerfile` 的差别

根目录 [`Dockerfile`](../Dockerfile) 是 **单应用、资源铺在站点根**：`turbo --filter=${APP}`，再 `COPY dist/${APP}` → `/usr/share/nginx/html`。适合 Render 一类「一个容器一个 SPA、自己注入 `PORT`」的平台。

本仓库生产环境的 Vite `base` 是 **`/main/`、`/login/`、`/agent/` …**（与 Pages 一致）。把 `dist/main` 拷到 html **根** 会导致 JS/CSS 仍请求 `/main/assets/…` 而文件不在那。上腾讯云整站必须：

1. 构建 **全部** `apps/*`，再跑 **`pnpm run postbuild`**（生成 `dist/index.html`、`404.html`）。
2. 把 **整棵 `dist/`** 拷进 nginx。

用仓库里的 [`Dockerfile.cvm`](../Dockerfile.cvm)，不要拿根 `Dockerfile` 当整站镜像。

```
本机 / CI
  pnpm build + postbuild     → dist/main dist/login … dist/index.html
  docker build -f Dockerfile.cvm
        ↓
  推 TCR（个人版 ccr.ccs.tencentyun.com / 企业版 *.tencentcloudcr.com）
        ↓
  CVM：docker pull && docker run -e PORT=80 -p 80:80
        ↓
  安全组 80/443 →（可选）域名 + 宿主机 HTTPS 反代
```

## 1. 机器与网络

| 项 | 建议 |
| --- | --- |
| 产品 | **云服务器 CVM** 或 **轻量应用服务器**；系统 **Ubuntu 22.04/24.04** 或 TencentOS |
| 规格 | 静态站：2 核 2G 足够；构建镜像建议在本机/CI 做，机器只跑 nginx 容器 |
| 地域 | 与 TCR、用户就近；CVM 与 TCR **同地域** 可走内网拉镜像 |
| 安全组 / 防火墙 | 入站 **22**（建议限 IP）、**80**、**443**；出站放行（拉镜像） |
| 公网 | 要绑定域名就买公网 IP；只要内网预览可只用内网 IP |

控制台路径（名称以控制台为准）：**云服务器 → 实例 → 安全组**，或轻量的防火墙。只开 Docker 映射端口，不要把 `2375` 暴露到公网。

## 2. 机器上安装 Docker

SSH 登录后装 **Docker Engine**（命令以当前发行版文档为准）。装好后：

```bash
sudo docker version
sudo usermod -aG docker $USER   # 重新登录后可免 sudo
```

国内拉 `nginx:alpine`、`node:20` 常慢：在 **容器镜像服务控制台** 看「镜像加速器」，把地址写入 `/etc/docker/daemon.json` 的 `registry-mirrors` 后 `sudo systemctl restart docker`。加速器只加快 **Docker Hub 基础镜像**；你自己的应用镜像走 TCR，不靠加速器。

## 3. 镜像仓库（TCR）

不要把镜像只放本机再 `docker save | ssh`（能应急，难更新）。用 **腾讯云容器镜像服务**：

| | 个人版 | 企业版 |
| --- | --- | --- |
| 域名 | `ccr.ccs.tencentyun.com`（香港等独立域以控制台为准，如 `hkccr.`） | `<实例名>.tencentcloudcr.com` |
| 登录用户 | **主账号 AppID / UIN**（控制台登录指引上的 username，不是邮箱） | 访问凭证里的用户名 |
| 密码 | 控制台「初始化密码」 | 临时或长期凭证 |
| 地址形态 | `ccr.ccs.tencentyun.com/<命名空间>/<仓库>:<tag>` | `<实例>.tencentcloudcr.com/<命名空间>/<仓库>:<tag>` |

个人版：开通 → 选地域（大陆个人版常挂在广州，部分地域可内网访问）→ **初始化密码** → 建 **命名空间**（例如 `private`）。仓库可在首次 `push` 时自动创建。

本机登录（示例为个人版）：

```bash
docker login ccr.ccs.tencentyun.com --username=<主账号ID>
```

CVM 上同样 `docker login` 一次，或把凭证放在该机器用户的 `~/.docker/config.json`（权限 600，不要提交到 Git）。

## 4. 本机构建并推送

在仓库根（与 `pnpm-workspace.yaml` 同级），Docker Desktop / Colima / OrbStack 已开：

```bash
# 整站镜像；tag 用 git sha，不要用 latest 当生产唯一标记
SHA="$(git rev-parse --short HEAD)"
NS=ccr.ccs.tencentyun.com/<命名空间>/web

docker build -f Dockerfile.cvm -t "${NS}:${SHA}" -t "${NS}:prod" .
docker push "${NS}:${SHA}"
docker push "${NS}:prod"
```

`Dockerfile.cvm` 内是 `pnpm run build` + `pnpm run postbuild`，与 Netlify / 全量 Pages 产物布局相同。构建要能访问 npm（corepack 拉 pnpm）。单应用 **`pnpm --filter <app> build`** 不够：不会跑 workspace 的 `^generate`（OpenAPI），也不生成根 `index.html`。

可选：把构建丢到 GitHub Actions，Secret 里放 TCR 密码，`docker/login-action` 后 buildx push。机器只 `pull` + `run`。

## 5. 机器上跑起来

```bash
NS=ccr.ccs.tencentyun.com/<命名空间>/web
SHA=<与推送相同的 tag>

docker pull "${NS}:${SHA}"
docker rm -f web 2>/dev/null || true
docker run -d \
  --name web \
  --restart unless-stopped \
  -e PORT=80 \
  -p 80:80 \
  "${NS}:${SHA}"
```

**必须** `-e PORT=80`：镜像沿用 `nginx.conf.template`，启动时 `envsubst` 写 `listen`。不设 `PORT` 时 nginx 配置是坏的。

浏览器访问 `http://<公网IP>`。根路径是 postbuild 的 `dist/index.html`（主应用）；`/login/`、`/agent/` 等为子应用静态目录。未命中的路径 `try_files` 回 `/index.html`，行为接近 Pages/Netlify 的 SPA fallback。

用 Compose 也可以（机器上 `docker compose`，Compose **V2**）：

```yaml
services:
  web:
    image: ccr.ccs.tencentyun.com/<命名空间>/web:prod
    container_name: web
    restart: unless-stopped
    environment:
      PORT: "80"
    ports:
      - "80:80"
```

## 6. 域名与 HTTPS

1. DNSPod / 腾讯云 DNS：A 记录到 CVM 公网 IP。
2. 安全组放行 **443**。
3. TLS **不要打进前端镜像**。在宿主机用 Caddy / nginx 听 443，反代到 `127.0.0.1:80`，证书用腾讯云 SSL（可免费 DV）或 Caddy 自动签。

容器继续只映射本机 80；公网 80 可只给 Caddy 做跳转。证书续期发生在宿主机，更新镜像不必碰密钥。

## 7. 更新与回滚

```bash
docker pull "${NS}:${新SHA}"
docker rm -f web
docker run -d --name web --restart unless-stopped -e PORT=80 -p 80:80 "${NS}:${新SHA}"
```

回滚：改回旧 tag 再 `run`。旧镜像未 `docker image prune` 前都在本地。

## 8. 排障

| 现象 | 先查 |
| --- | --- |
| 浏览器连不上 | 安全组 / 轻量防火墙是否放行 80；`docker ps` 是否在跑；`curl -I http://127.0.0.1` |
| 页面空、资源 404 | 是否误用了根 `Dockerfile`（单应用拷到站点根）；是否漏了 `postbuild` |
| nginx 起不来 | 没设 `PORT`；`docker logs web` |
| `pull` 拒绝 | 未 `docker login`；用户名不是 AppID；命名空间写错 |
| 拉镜像极慢 | CVM 与 TCR 不同地域走了公网；改同地域或开内网访问 |
| `/login` 刷新 404 | 镜像里应有 `dist/login/` 且 nginx `try_files` 回 `/index.html`；不要只用 `dist/login` 当整站根 |

## 9. 什么时候不要停在「一台机 + docker run」

- 要滚动更新、多副本、证书自动进集群：同一镜像改上 **k3s** 或腾讯云 **TKE**，见 [k3s](../other/k3s-from-0-to-1/03-this-repo.md)。
- 只要静态托管、不想管机器：继续 Pages / Netlify。
- 不要在 CVM 上装 Node 再 `pnpm build` 当生产（机器变构建机、产物不进镜像，回滚困难）。构建在本机或 CI，机器只跑 nginx 容器。
