#!/bin/bash
# 独立于仓库根 pnpm workspace，必须加 --ignore-workspace。
set -euo pipefail
cd "$(dirname "$0")"
pnpm install --ignore-workspace
echo "依赖已装。开发：pnpm tauri dev"
echo "出安装包：pnpm tauri build"
