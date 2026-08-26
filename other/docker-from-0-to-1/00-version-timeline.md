# 0. Docker 版本时间线

「Docker」常被混成三样东西：**Docker Engine**（守护进程 + CLI）、**Docker Desktop**（Mac/Windows 套件）、**Compose**（多容器编排文件）。下面 Engine 为主。

## Engine 大版本

| 版本 | 时间 | 一句话 |
| --- | --- | --- |
| 0.x | 2013 | dotCloud 开源；LXC → 自研 libcontainer |
| **1.0** | 2014-06 | 生产可用；镜像 + 容器模型定型 |
| 1.9–1.13 | 2015–2017 | 网络/卷插件、`ARG`（**≥1.9**）、`HEALTHCHECK`（**≥1.12**） |
| **17.03** | 2017-03 | 版本号改成 **YY.MM**；CE / EE 分叉 |
| **17.05** | 2017-05 | **多阶段构建** `FROM … AS` |
| **18.09** | 2018-11 | **BuildKit** 可开（`DOCKER_BUILDKIT=1`） |
| 19.03 | 2019 | 最后一代 19.x；rootless 实验 |
| **20.10** | 2020-12 | 很长寿的 LTS 感版本；Compose V2 插件起步 |
| **23.0** | 2023-02 | 回到 **主版本号**；**BuildKit 默认开** |
| 24–27 | 2023–2024 | containerd / BuildKit / Compose 持续跟进 |
| **28** | 2025 | 许多发行版仍停在这一代 |
| **29.0** | **2025-11** | 当前主线；静态包里的 containerd 已到 **2.x** |
| 29.7 | 2026-08 | 本稿对照的补丁线（如 29.7.2） |

OCI（Open Container Initiative，**2015**）把镜像格式和运行时（`runc`）标准化。所以：**Docker 打的镜像，k8s/k3s 也能跑。**

## 不要和这些版本号搞混

| 名字 | 是什么 |
| --- | --- |
| Docker Desktop | Mac/Win 上的 VM + Engine + UI；版本号独立（4.x） |
| Compose **文件** | `compose-spec`，和 CLI 大版本不是一一对应 |
| Compose **CLI** | V1 Python `docker-compose`（**2023 EOL**）；V2+ 是 Go 插件 `docker compose`；2026 年 CLI 已到 **v5.x** |
| BuildKit | 构建后端（moby/buildkit），Engine 打包进去 |
| containerd | 容器运行时；Engine 用它，k8s/k3s **直接**用它 |
| runc | 真正 `clone` 出进程的 OCI 运行时 |

## 关键行为变化（排障用）

| 变化 | 版本 |
| --- | --- |
| 多阶段构建 | **≥17.05** |
| BuildKit 可选 | **≥18.09** |
| BuildKit 默认 | **≥23.0** |
| `RUN --mount=type=cache` / `secret` / `ssh` | BuildKit |
| `docker compose` 取代 `docker-compose` | Compose **V2**（约 2020–2022 GA） |
| Compose V1 停止维护 | **2023-07** |
| 构建前端语法 `syntax=docker/dockerfile:1` | BuildKit |

Mac 上：没有 Linux 内核，Engine 跑在 **Linux VM** 里（Desktop / Colima / OrbStack / Rancher Desktop）。命令看起来一样，路径、端口、性能和真 Linux 不完全一样。
