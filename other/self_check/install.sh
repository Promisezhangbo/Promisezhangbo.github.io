#!/usr/bin/env bash
# 把「电脑自检」安装成 macOS 应用，放到桌面（并复制一份到 ~/Applications）。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="电脑自检"
STAGE="$ROOT/dist/${APP_NAME}.app"
DESKTOP="$HOME/Desktop/${APP_NAME}.app"
USER_APPS="$HOME/Applications/${APP_NAME}.app"

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "缺少命令：$1" >&2
    exit 1
  }
}

need swiftc
need sips
need iconutil

PYTHON=""
for candidate in /usr/local/bin/python3 /opt/homebrew/bin/python3 /usr/bin/python3; do
  if [[ -x "$candidate" ]] && "$candidate" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 9) else 1)'; then
    PYTHON="$candidate"
    break
  fi
done
if [[ -z "$PYTHON" ]]; then
  echo "需要 Python 3.9+。可用 Homebrew：brew install python" >&2
  exit 1
fi

echo "使用 Python：$PYTHON"
echo "正在编译原生窗口…"

rm -rf "$ROOT/dist"
mkdir -p "$STAGE/Contents/MacOS" "$STAGE/Contents/Resources/web" "$ROOT/dist/icon.iconset"

swiftc -swift-version 5 -O \
  -o "$STAGE/Contents/MacOS/SelfCheck" \
  "$ROOT/app/macos/App.swift" \
  -framework Cocoa \
  -framework WebKit

cp "$ROOT/app/macos/Info.plist" "$STAGE/Contents/Info.plist"
cp "$ROOT/check.py" "$STAGE/Contents/Resources/check.py"
cp "$ROOT/app/server.py" "$STAGE/Contents/Resources/server.py"
cp "$ROOT/app/web/index.html" "$ROOT/app/web/styles.css" "$ROOT/app/web/app.js" \
  "$STAGE/Contents/Resources/web/"
printf '%s\n' "$PYTHON" >"$STAGE/Contents/Resources/python_path.txt"

echo "正在生成图标…"
"$PYTHON" "$ROOT/app/macos/make_icon.py" "$ROOT/dist/icon.ppm"
sips -s format png "$ROOT/dist/icon.ppm" --out "$ROOT/dist/icon.png" >/dev/null
sips -z 1024 1024 "$ROOT/dist/icon.png" --out "$ROOT/dist/icon.png" >/dev/null
for spec in \
  "16 icon_16x16.png" \
  "32 icon_16x16@2x.png" \
  "32 icon_32x32.png" \
  "64 icon_32x32@2x.png" \
  "128 icon_128x128.png" \
  "256 icon_128x128@2x.png" \
  "256 icon_256x256.png" \
  "512 icon_256x256@2x.png" \
  "512 icon_512x512.png" \
  "1024 icon_512x512@2x.png"; do
  set -- $spec
  sips -z "$1" "$1" "$ROOT/dist/icon.png" --out "$ROOT/dist/icon.iconset/$2" >/dev/null
done
iconutil -c icns "$ROOT/dist/icon.iconset" -o "$STAGE/Contents/Resources/AppIcon.icns"
rm -rf "$ROOT/dist/icon.iconset" "$ROOT/dist/icon.ppm" "$ROOT/dist/icon.png"

chmod 755 "$STAGE/Contents/MacOS/SelfCheck"

echo "正在安装到桌面…"
rm -rf "$DESKTOP"
cp -R "$STAGE" "$DESKTOP"

mkdir -p "$HOME/Applications"
rm -rf "$USER_APPS"
cp -R "$STAGE" "$USER_APPS"

# 本地编译的应用去掉隔离属性，避免第一次双击被 Gatekeeper 拦
xattr -cr "$DESKTOP" 2>/dev/null || true
xattr -cr "$USER_APPS" 2>/dev/null || true

echo
echo "已安装："
echo "  $DESKTOP"
echo "  $USER_APPS"
echo
echo "双击桌面上的「${APP_NAME}」即可打开。点「开始自检」。"
echo "历史记录保存在：~/Library/Application Support/SelfCheck/history"
