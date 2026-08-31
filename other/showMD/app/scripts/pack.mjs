#!/usr/bin/env node
/**
 * 按当前操作系统打安装包。
 * Mac → dmg；Windows → NSIS exe。不能在 Mac 上交叉编出 Windows 包。
 *
 *   pnpm pack        自动按本机系统
 *   pnpm pack:mac    仅 macOS
 *   pnpm pack:win    仅 Windows
 */
import { spawnSync } from 'node:child_process'
import { platform } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const os = platform()
const mode = process.argv[2] ?? 'auto'

function fail(msg) {
  console.error(msg)
  process.exit(1)
}

function pack(bundles) {
  const result = spawnSync(
    'pnpm',
    ['exec', 'tauri', 'build', '--bundles', bundles],
    { cwd: root, stdio: 'inherit', shell: os === 'win32' },
  )
  process.exit(result.status === null ? 1 : result.status)
}

if (mode === 'mac') {
  if (os !== 'darwin') {
    fail(
      'pack:mac 只能在 macOS 上执行。\nWindows 安装包请在 Windows 上跑 pnpm pack:win，或 git tag v* 走 GitHub Actions。',
    )
  }
  pack('dmg')
}

if (mode === 'win') {
  if (os !== 'win32') {
    fail(
      'pack:win 只能在 Windows 上执行（还需要 VS Build Tools / C++）。\n本机请用 pnpm pack:mac 打 dmg；Windows 包用 Actions：.github/workflows/release.yml',
    )
  }
  pack('nsis')
}

if (mode === 'auto') {
  if (os === 'darwin') pack('dmg')
  if (os === 'win32') pack('nsis')
  fail(`当前系统 ${os} 不支持本地打包。Mac / Windows 安装包请用 GitHub Actions。`)
}

fail(`未知参数 ${mode}。用法：pnpm pack | pnpm pack:mac | pnpm pack:win`)
