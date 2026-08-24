# 电脑自检

macOS 桌面应用：点一下开始检查这台电脑为什么卡，看问题和优化建议，并保留历史记录。命令行脚本仍然可用。

## 安装成桌面上的应用

需要：macOS 12+、Python 3.9+、Xcode Command Line Tools（有 `swiftc`）。

```bash
cd other/self_check
chmod +x install.sh
./install.sh
```

安装完成后，桌面和 `~/Applications` 都会出现 **电脑自检.app**。双击打开，点 **开始自检**。

历史记录存在：

`~/Library/Application Support/SelfCheck/history`

卸载：把桌面 / 应用程序里的「电脑自检」拖进废纸篓即可。记录不会自动删，可手动删上面的目录。

开发时只开界面、不装 .app：

```bash
python3 other/self_check/app/server.py --open
```

## 命令行

```bash
cd other/self_check
./run.sh
python3 check.py --quick
python3 check.py --json
```

| 参数 | 含义 |
| --- | --- |
| `--quick` | 跳过 ping、iostat 等较慢采样 |
| `--json` | 打印 JSON |
| `--no-save` | 不写入历史 |
| `--no-color` | 关闭终端颜色 |

## 会检查什么

- **CPU**：负载 vs 核心数、高占用进程
- **内存**：Memory Pressure、压缩内存、Swap（不是「空闲内存低」）
- **磁盘**：数据卷 / APFS 容器剩余空间、瞬时 I/O
- **散热 / 电源**：是否降频、低电量模式
- **后台**：Spotlight、Time Machine、登录项、LaunchAgent
- **开发机常见凶手**：Chrome / QQ 浏览器、Docker、过多 Node/Vite、Cursor / VS Code Helper

`严重` / `警告` 需要处理；`提示` 一般不是主因。
