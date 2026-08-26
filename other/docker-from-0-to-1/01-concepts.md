# 1. 镜像、容器、网络、存储

Docker 解决的是：**同一份构建产物，在任何装了兼容运行时的机器上以隔离进程跑起来。**

## 1.1 镜像 vs 容器

**镜像（image）** 是只读分层文件系统 + 元数据（默认用户、入口命令、环境变量）。用 tag 引用：`nginx:alpine`、`node:20-bookworm-slim`。

**容器（container）** 是镜像上面再叠一层可写层，再加进程、网络、挂载。删容器默认不删镜像。

```text
镜像层（只读，可共享）     nginx:alpine 的各层
         +
可写层（容器自己的）       运行时改过的文件
         +
进程 / 网络 / 挂载
```

常用命令：

```bash
docker build -t my-app:dev .
docker run --rm -p 8080:80 my-app:dev
docker ps
docker logs <id>
docker exec -it <id> sh
```

`-p 主机端口:容器端口`。容器内监听的端口要和镜像里进程一致（本仓库 nginx 用环境变量 `PORT`）。

## 1.2 分层与缓存

每条 `Dockerfile` 指令通常产生一层。**从上到下**，某层变了，后面整段缓存失效。所以：先拷 `package.json` / lockfile 再 `pnpm install`，源码变动不会每次重装依赖。本仓库 `Dockerfile` 就是这个顺序。

`.dockerignore` 和 `.gitignore` 类似：不要把 `node_modules`、`.git` 打进构建上下文（上下文会发给守护进程，越大越慢）。

## 1.3 网络

默认 `bridge`：容器有独立 IP，容器名在 **用户自定义网络** 上可当 DNS（Compose 默认给项目建一个）。

| 模式 | 用途 |
| --- | --- |
| bridge | 默认；端口映射到主机 |
| host | 共用主机网络栈（Linux；Desktop 上行为有限） |
| none | 无网 |
| 自定义 bridge | Compose / 多容器互访 |

`localhost` 在容器里是 **容器自己**，不是宿主机。容器要访问宿主机上的服务：Linux 用宿主机 IP；Desktop 常用 `host.docker.internal`。

## 1.4 存储

容器可写层随容器删掉。要持久化：

| 方式 | 特点 |
| --- | --- |
| **named volume** | Docker 管目录；适合数据库数据 |
| **bind mount** | 挂主机路径；适合开发时挂源码 |
| tmpfs | 内存，重启丢失 |

匿名卷容易忘记，排障先 `docker volume ls`。

## 1.5 和「虚拟机」的差别

容器 **共享宿主机内核**，隔离的是进程、文件系统、网络命名空间（namespaces + cgroups）。不是完整 guest OS。所以：镜像里的发行版只是用户空间；不能在 Linux 宿主机上跑 Windows 容器（反过来也不行）。Mac 上「能跑 Linux 容器」是因为底下有 Linux VM。

## 1.6 安全常识（够用）

- 不要用 latest 当生产 tag，打 git sha 或版本号。
- 不要把密钥 `COPY` 进镜像、不要 `ENV PASSWORD=`；BuildKit 用 `RUN --mount=type=secret`。
- 生产镜像尽量非 root；本仓库运行阶段是 nginx 镜像惯例用户。
- `docker.sock` 挂进容器 ≈ 给了宿主机 root，CI/CD 里要当高权限依赖。
