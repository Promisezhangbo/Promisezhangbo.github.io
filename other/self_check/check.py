#!/usr/bin/env python3
"""电脑自检：采集系统指标，诊断卡顿原因并给出优化建议。

零第三方依赖，macOS 为主，Linux 可用子集。Python 3.9+。
"""

from __future__ import annotations

import argparse
import json
import os
import platform
import re
import shutil
import socket
import subprocess
import sys
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

VERSION = "2.0.0"
HERE = Path(__file__).resolve().parent
APP_ID = "SelfCheck"


# ---------------------------------------------------------------------------
# 终端颜色
# ---------------------------------------------------------------------------

class C:
    reset = "\033[0m"
    bold = "\033[1m"
    dim = "\033[2m"
    red = "\033[31m"
    green = "\033[32m"
    yellow = "\033[33m"
    blue = "\033[34m"
    magenta = "\033[35m"
    cyan = "\033[36m"
    gray = "\033[90m"

    @classmethod
    def disable(cls) -> None:
        for k in list(vars(cls)):
            if not k.startswith("_") and isinstance(getattr(cls, k), str):
                setattr(cls, k, "")


LEVEL_RANK = {"ok": 0, "info": 1, "warn": 2, "crit": 3}
LEVEL_CN = {"ok": "正常", "info": "提示", "warn": "警告", "crit": "严重"}
LEVEL_COLOR = {
    "ok": lambda s: f"{C.green}{s}{C.reset}",
    "info": lambda s: f"{C.cyan}{s}{C.reset}",
    "warn": lambda s: f"{C.yellow}{s}{C.reset}",
    "crit": lambda s: f"{C.red}{C.bold}{s}{C.reset}",
}


# ---------------------------------------------------------------------------
# 数据结构
# ---------------------------------------------------------------------------

@dataclass
class Finding:
    category: str
    level: str
    title: str
    details: list[str] = field(default_factory=list)
    suggestions: list[str] = field(default_factory=list)
    score: int = 0


@dataclass
class Proc:
    pid: int
    cpu: float
    mem: float
    rss_mb: float
    command: str
    family: str


# ---------------------------------------------------------------------------
# 工具
# ---------------------------------------------------------------------------

def run(
    args: list[str],
    timeout: float = 8,
    env: dict[str, str] | None = None,
) -> tuple[int, str, str]:
    try:
        completed = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=timeout,
            env=env,
            check=False,
        )
        return completed.returncode, completed.stdout or "", completed.stderr or ""
    except subprocess.TimeoutExpired:
        return -1, "", "timeout"
    except FileNotFoundError:
        return -1, "", "not found"
    except Exception as exc:  # noqa: BLE001 — 采集失败不应中断整次自检
        return -1, "", str(exc)


def get_loadavg() -> list[float]:
    try:
        return list(os.getloadavg())
    except OSError:
        return [0.0, 0.0, 0.0]


def first_line(text: str) -> str:
    return (text or "").strip().splitlines()[0].strip() if text.strip() else ""


def parse_float(text: str, default: float = 0.0) -> float:
    try:
        return float(text.replace(",", "").strip())
    except (TypeError, ValueError):
        return default


def bytes_human(n: float) -> str:
    units = ["B", "KB", "MB", "GB", "TB", "PB"]
    value = float(max(n, 0))
    for unit in units:
        if value < 1024 or unit == units[-1]:
            if unit == "B":
                return f"{int(value)} {unit}"
            return f"{value:.1f} {unit}"
        value /= 1024
    return f"{value:.1f} PB"


def parse_size_to_bytes(text: str) -> float:
    """把 '1024.00M' / '4.2G' / '512K' 转成字节。"""
    m = re.search(r"([\d.]+)\s*([KMGTP]i?B|[KMGTP])?", text, re.I)
    if not m:
        return 0.0
    num = parse_float(m.group(1))
    unit = (m.group(2) or "B").upper().replace("IB", "B")
    mul = {
        "B": 1,
        "K": 1024,
        "KB": 1024,
        "M": 1024**2,
        "MB": 1024**2,
        "G": 1024**3,
        "GB": 1024**3,
        "T": 1024**4,
        "TB": 1024**4,
    }.get(unit, 1)
    return num * mul


def which(name: str) -> str | None:
    return shutil.which(name)


# ---------------------------------------------------------------------------
# 进程归类（开发机卡顿常见凶手）
# ---------------------------------------------------------------------------

_FAMILY_RULES: list[tuple[str, tuple[str, ...]]] = [
    ("QQ浏览器", ("qqbrowser", "qq browser")),
    ("Google Chrome", ("google chrome", "chrome helper", "chromedriver")),
    ("Cursor", ("cursor helper", "cursor.app", "cursor helper (renderer)", "cursor helper (plugin)")),
    ("VS Code", ("visual studio code", "code helper", "code.app")),
    ("Docker", ("com.docker", "docker desktop", "docker.exe", "com.apple.virtualization", "qemu", "vpnkit")),
    ("Node / 前端工具链", ("node ", "/node", "nodejs", "esbuild", "vite", "turbo", "webpack", "rollup")),
    ("Spotlight 索引", ("mds_stores", "mdworker", "/usr/libexec/mds")),
    ("Time Machine", ("backupd", "backupd-helper")),
    ("iCloud 同步", ("/usr/libexec/bird", "cloudd", "fileprovider")),
    ("照片图库", ("photolibraryd", "photoanalysisd", "cloudphotod")),
    ("微信", ("wechat", "weixin", "微信")),
    ("飞书 / Lark", ("lark", "feishu", "飞书")),
    ("钉钉", ("dingtalk", "钉钉")),
    ("Slack", ("slack.app", "slack helper", "com.tinyspeck")),
    ("Safari", ("safari.app", "com.apple.webkit")),
    ("Firefox", ("firefox.app", "firefox helper")),
    ("企业安全/VPN", ("corplink", "corp link", "clashx", "surge", "wireguard", "openvpn", "zerotier", "tailscale")),
    ("WindowServer", ("windowserver",)),
    ("kernel_task", ("kernel_task",)),
    ("系统更新", ("softwareupdated", "storedownloadd", "mobileasset")),
    ("Python", ("python3", "python ")),
    ("Java", ("java ", "/java")),
]


def app_family(command: str) -> str:
    low = command.lower()
    for name, keys in _FAMILY_RULES:
        if any(k in low for k in keys):
            return name
    # /Applications/Foo.app/...
    m = re.search(r"/Applications/([^/]+)\.app/", command)
    if m:
        return m.group(1)
    base = Path(command.split()[0]).name if command.strip() else command
    return base[:48] or "unknown"


def short_cmd(command: str, width: int = 72) -> str:
    text = " ".join(command.split())
    if len(text) <= width:
        return text
    return text[: width - 1] + "…"


# ---------------------------------------------------------------------------
# 采集
# ---------------------------------------------------------------------------

def collect_system() -> dict[str, Any]:
    info: dict[str, Any] = {
        "os": platform.system(),
        "os_release": platform.release(),
        "arch": platform.machine(),
        "hostname": socket.gethostname(),
        "python": platform.python_version(),
        "now": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "ncpu": os.cpu_count() or 1,
        "uptime_sec": None,
        "macos_version": None,
        "cpu_brand": None,
        "mem_bytes": None,
        "model": None,
        "rosetta": False,
        "apple_silicon": False,
        "boot_time": None,
    }
    if platform.system() == "Darwin":
        code, out, _ = run(["sw_vers"])
        if code == 0:
            prod = re.search(r"ProductName:\s*(.+)", out)
            ver = re.search(r"ProductVersion:\s*(.+)", out)
            build = re.search(r"BuildVersion:\s*(.+)", out)
            bits = [g.group(1).strip() for g in (prod, ver, build) if g]
            info["macos_version"] = " ".join(bits)

        _, brand, _ = run(["sysctl", "-n", "machdep.cpu.brand_string"])
        info["cpu_brand"] = brand.strip() or None

        _, mem, _ = run(["sysctl", "-n", "hw.memsize"])
        if mem.strip().isdigit():
            info["mem_bytes"] = int(mem.strip())

        _, ncpu, _ = run(["sysctl", "-n", "hw.ncpu"])
        if ncpu.strip().isdigit():
            info["ncpu"] = int(ncpu.strip())

        _, model, _ = run(["sysctl", "-n", "hw.model"])
        info["model"] = model.strip() or None

        _, arm, _ = run(["sysctl", "-n", "hw.optional.arm64"])
        info["apple_silicon"] = arm.strip() == "1"
        # 当前进程是否跑在 Rosetta 下
        _, trans, _ = run(["sysctl", "-n", "sysctl.proc_translated"])
        info["rosetta"] = trans.strip() == "1"
        if info["apple_silicon"] and platform.machine() == "x86_64":
            info["rosetta"] = True

        # 更友好的机型名
        _, sp, _ = run(
            ["system_profiler", "SPHardwareDataType", "-detailLevel", "mini"],
            timeout=12,
        )
        if sp:
            m = re.search(r"Model Name:\s*(.+)", sp)
            ident = re.search(r"Model Identifier:\s*(.+)", sp)
            chip = re.search(r"Chip:\s*(.+)", sp)
            if m:
                info["model_name"] = m.group(1).strip()
            if ident:
                info["model"] = ident.group(1).strip()
            if chip:
                info["cpu_brand"] = chip.group(1).strip()

        _, boot, _ = run(["sysctl", "-n", "kern.boottime"])
        # { sec = 123, usec = 0 } Sat ...
        m = re.search(r"sec\s*=\s*(\d+)", boot)
        if m:
            info["boot_time"] = int(m.group(1))
            info["uptime_sec"] = max(0, int(time.time()) - info["boot_time"])
    else:
        info["cpu_brand"] = platform.processor() or None
        try:
            with open("/proc/meminfo", encoding="utf-8") as fh:
                for line in fh:
                    if line.startswith("MemTotal:"):
                        kb = int(line.split()[1])
                        info["mem_bytes"] = kb * 1024
                        break
        except OSError:
            pass
        try:
            with open("/proc/uptime", encoding="utf-8") as fh:
                info["uptime_sec"] = float(fh.read().split()[0])
        except OSError:
            pass

    info["loadavg"] = get_loadavg()
    return info


def collect_cpu_sample(quick: bool) -> dict[str, Any]:
    data: dict[str, Any] = {
        "user": None,
        "sys": None,
        "idle": None,
        "iowait": None,
        "loadavg": get_loadavg(),
    }
    if platform.system() == "Darwin":
        # -l 2 -s 1：两次采样，第二次才是真实占用（约 1s）
        samples = 1 if quick else 2
        interval = 0 if quick else 1
        code, out, _ = run(
            ["top", "-l", str(samples), "-s", str(interval), "-n", "0", "-stats", "cpu"],
            timeout=8 if quick else 12,
        )
        if code == 0 and out:
            lines = [ln for ln in out.splitlines() if "CPU usage" in ln]
            if lines:
                last = lines[-1]
                # CPU usage: 12.34% user, 5.67% sys, 81.99% idle
                u = re.search(r"([\d.]+)%\s*user", last)
                s = re.search(r"([\d.]+)%\s*sys", last)
                i = re.search(r"([\d.]+)%\s*idle", last)
                if u:
                    data["user"] = parse_float(u.group(1))
                if s:
                    data["sys"] = parse_float(s.group(1))
                if i:
                    data["idle"] = parse_float(i.group(1))
    else:
        # 读 /proc/stat 两次
        def read_stat() -> tuple[int, int, int, int] | None:
            try:
                with open("/proc/stat", encoding="utf-8") as fh:
                    parts = fh.readline().split()
                vals = [int(x) for x in parts[1:]]
                idle = vals[3] + (vals[4] if len(vals) > 4 else 0)
                iowait = vals[4] if len(vals) > 4 else 0
                total = sum(vals)
                user = vals[0] + vals[1]
                sysv = vals[2]
                return user, sysv, idle, iowait if total else None
            except OSError:
                return None

        a = read_stat()
        if a and not quick:
            time.sleep(0.8)
            b = read_stat()
            if b:
                du, ds, di, dw = b[0] - a[0], b[1] - a[1], b[2] - a[2], b[3] - a[3]
                dt = du + ds + di
                if dt > 0:
                    data["user"] = du / dt * 100
                    data["sys"] = ds / dt * 100
                    data["idle"] = di / dt * 100
                    data["iowait"] = dw / dt * 100
    return data


def collect_memory() -> dict[str, Any]:
    data: dict[str, Any] = {
        "page_size": 4096,
        "pressure": None,
        "swap_total": 0.0,
        "swap_used": 0.0,
        "pages": {},
        "bytes": {},
    }
    if platform.system() == "Darwin":
        _, vm, _ = run(["vm_stat"])
        ps = 4096
        m = re.search(r"page size of (\d+)", vm, re.I)
        if m:
            ps = int(m.group(1))
        data["page_size"] = ps
        for line in vm.splitlines():
            if ":" not in line:
                continue
            key, val = line.split(":", 1)
            num = re.search(r"[\d.]+", val.replace(".", ""))
            if not num:
                # "12345." 带点
                num = re.search(r"\d+", val)
            if not num:
                continue
            data["pages"][key.strip().strip('"')] = int(num.group(0))

        def pages_bytes(name: str) -> int:
            return int(data["pages"].get(name, 0)) * ps

        data["bytes"] = {
            "free": pages_bytes("Pages free"),
            "active": pages_bytes("Pages active"),
            "inactive": pages_bytes("Pages inactive"),
            "speculative": pages_bytes("Pages speculative"),
            "wired": pages_bytes("Pages wired down"),
            "purgeable": pages_bytes("Pages purgeable"),
            "file_backed": pages_bytes("File-backed pages"),
            "anonymous": pages_bytes("Anonymous pages"),
            "compressor_pages": pages_bytes("Pages stored in compressor"),
            "compressor_occupied": pages_bytes("Pages occupied by compressor"),
        }
        data["compressions"] = int(data["pages"].get("Compressions", 0))
        data["decompressions"] = int(data["pages"].get("Decompressions", 0))
        data["swapins"] = int(data["pages"].get("Swapins", 0))
        data["swapouts"] = int(data["pages"].get("Swapouts", 0))
        data["pageins"] = int(data["pages"].get("Pageins", 0))
        data["pageouts"] = int(data["pages"].get("Pageouts", 0))

        _, swap, _ = run(["sysctl", "-n", "vm.swapusage"])
        # total = 1024.00M  used = 12.50M  free = 1011.50M
        for label, key in (("total", "swap_total"), ("used", "swap_used")):
            m = re.search(rf"{label}\s*=\s*([\d.]+\s*[A-Za-z]+)", swap)
            if m:
                data[key] = parse_size_to_bytes(m.group(1))

        code, mp, _ = run(["memory_pressure"], timeout=6)
        if code == 0:
            low = mp.lower()
            pct = re.search(r"memory free percentage:\s*(\d+)", low)
            if pct:
                data["free_pct"] = int(pct.group(1))
            if "critical" in low:
                data["pressure"] = "critical"
            elif re.search(r"\bwarn", low):
                data["pressure"] = "warn"
            elif "normal" in low:
                data["pressure"] = "normal"
            else:
                # 新版 macOS 不再打印 warn/critical 字样，用 Swap + 压缩内存推断
                swap_used = float(data.get("swap_used") or 0)
                compressor = int(data["bytes"].get("compressor_occupied") or 0)
                if swap_used >= 2 * 1024**3 or (data.get("swapouts") or 0) > 1_000_000:
                    data["pressure"] = "critical"
                elif swap_used >= 256 * 1024**2 or compressor > 1.5 * 1024**3:
                    data["pressure"] = "warn"
                else:
                    data["pressure"] = "normal"
            data["pressure_raw"] = first_line(mp)
    else:
        try:
            kv: dict[str, int] = {}
            with open("/proc/meminfo", encoding="utf-8") as fh:
                for line in fh:
                    parts = line.split()
                    if len(parts) >= 2:
                        kv[parts[0].rstrip(":")] = int(parts[1]) * 1024
            data["bytes"] = {
                "free": kv.get("MemFree", 0),
                "available": kv.get("MemAvailable", 0),
                "total": kv.get("MemTotal", 0),
                "cached": kv.get("Cached", 0),
                "buffers": kv.get("Buffers", 0),
                "anon": kv.get("AnonPages", 0),
            }
            data["swap_total"] = float(kv.get("SwapTotal", 0))
            data["swap_used"] = float(kv.get("SwapTotal", 0) - kv.get("SwapFree", 0))
            avail = kv.get("MemAvailable") or kv.get("MemFree") or 0
            total = kv.get("MemTotal") or 1
            ratio = avail / total
            if ratio < 0.08:
                data["pressure"] = "critical"
            elif ratio < 0.15:
                data["pressure"] = "warn"
            else:
                data["pressure"] = "normal"
        except OSError:
            pass
    return data


def _parse_df_kp(mount: str) -> dict[str, Any] | None:
    """POSIX `df -kP`：Capacity 列可靠，避免 macOS 把 %iused 当成占用率。"""
    code, out, _ = run(["df", "-kP", mount])
    if code != 0:
        return None
    lines = [ln for ln in out.splitlines() if ln.strip()]
    if len(lines) < 2:
        return None
    parts = lines[-1].split()
    if len(parts) < 6:
        return None
    used_k = parse_float(parts[-4])
    avail_k = parse_float(parts[-3])
    used_pct = parse_float(parts[-2].replace("%", ""))
    return {
        "mount": parts[-1],
        "used_pct": used_pct,
        "used": used_k * 1024,
        "avail": avail_k * 1024,
        "total": (used_k + avail_k) * 1024,
    }


def _bytes_in_parens(text: str) -> float | None:
    m = re.search(r"\((\d+)\s*Bytes\)", text)
    return float(m.group(1)) if m else None


def collect_disk() -> dict[str, Any]:
    data: dict[str, Any] = {"volumes": [], "inodes": {}}
    mounts = ["/"]
    if platform.system() == "Darwin":
        mounts.append("/System/Volumes/Data")
    for mount in mounts:
        parsed = _parse_df_kp(mount)
        if parsed:
            data["volumes"].append(parsed)

    inode_mount = "/System/Volumes/Data" if platform.system() == "Darwin" else "/"
    code, out, _ = run(["df", "-i", inode_mount])
    if code == 0:
        lines = [ln for ln in out.splitlines() if ln.strip()]
        if len(lines) >= 2:
            parts = lines[-1].split()
            if parts:
                # macOS: ... iused ifree %iused Mounted
                pct_token = next((p for p in reversed(parts) if "%" in p), "0%")
                data["inodes"] = {
                    "used_pct": parse_float(str(pct_token).replace("%", "").replace("-", "0")),
                    "mount": inode_mount,
                    "raw": lines[-1],
                }

    if platform.system() == "Darwin":
        _, info, _ = run(["diskutil", "info", "/"], timeout=10)
        fv = re.search(r"FileVault:\s*(.+)", info)
        if fv:
            data["filevault"] = fv.group(1).strip()
        cont_free = re.search(r"Container Free Space:\s*(.+)", info)
        cont_total = re.search(r"Container Total Space:\s*(.+)", info)
        if cont_free:
            data["container_free_raw"] = cont_free.group(1).strip()
            data["container_free"] = _bytes_in_parens(cont_free.group(1))
        if cont_total:
            data["container_total_raw"] = cont_total.group(1).strip()
            data["container_total"] = _bytes_in_parens(cont_total.group(1))
        disk_size = re.search(r"Disk Size:\s*(.+)", info)
        if disk_size:
            data["disk_size_raw"] = disk_size.group(1).strip()
    return data


def collect_iostat(quick: bool) -> dict[str, Any]:
    data: dict[str, Any] = {}
    if quick:
        return data
    if platform.system() == "Darwin":
        code, out, _ = run(["iostat", "-w", "1", "-c", "2"], timeout=6)
        if code != 0 or not out:
            return data
        # 取最后一行数据
        rows = [ln for ln in out.splitlines() if re.search(r"\d", ln) and "disk" not in ln.lower() and "cpu" not in ln.lower()]
        if not rows:
            return data
        parts = rows[-1].split()
        # disk0: KB/t tps MB/s   cpu: us sy id   load: 1m 5m 15m
        # 可能有多块磁盘。macOS 默认 disk0 三列 + cpu 三列 + load 三列
        if len(parts) >= 9:
            data["kb_t"] = parse_float(parts[0])
            data["tps"] = parse_float(parts[1])
            data["mb_s"] = parse_float(parts[2])
            data["cpu_us"] = parse_float(parts[-6])
            data["cpu_sy"] = parse_float(parts[-5])
            data["cpu_id"] = parse_float(parts[-4])
    else:
        if which("iostat"):
            code, out, _ = run(["iostat", "-d", "-y", "1", "2"], timeout=6)
            data["raw_tail"] = "\n".join(out.splitlines()[-4:])
    return data


def collect_processes() -> list[Proc]:
    # pid pcpu pmem rss command
    code, out, _ = run(["ps", "ax", "-o", "pid=,pcpu=,pmem=,rss=,command="], timeout=10)
    if code != 0:
        return []
    procs: list[Proc] = []
    for line in out.splitlines():
        m = re.match(r"\s*(\d+)\s+([\d.]+)\s+([\d.]+)\s+(\d+)\s+(.*)$", line)
        if not m:
            continue
        cmd = m.group(5).strip()
        procs.append(
            Proc(
                pid=int(m.group(1)),
                cpu=parse_float(m.group(2)),
                mem=parse_float(m.group(3)),
                rss_mb=parse_float(m.group(4)) / 1024.0,
                command=cmd,
                family=app_family(cmd),
            )
        )
    return procs


def collect_thermal() -> dict[str, Any]:
    data: dict[str, Any] = {}
    if platform.system() != "Darwin":
        return data
    _, therm, _ = run(["pmset", "-g", "therm"])
    data["therm_raw"] = therm.strip()
    m = re.search(r"CPU_Speed_Limit\s*=\s*(\d+)", therm)
    if m:
        data["cpu_speed_limit"] = int(m.group(1))
    m = re.search(r"CPU_Available_CPUs\s*=\s*(\d+)", therm)
    if m:
        data["cpu_available"] = int(m.group(1))
    m = re.search(r"BackgroundTaskDisabled\s*=\s*(\d+)", therm)
    if m:
        data["bg_disabled"] = m.group(1) == "1"

    _, batt, _ = run(["pmset", "-g", "batt"])
    data["batt_raw"] = batt.strip()
    if "AC Power" in batt or "AC attached" in batt or "charging" in batt.lower():
        data["power_source"] = "ac"
    elif "Battery" in batt:
        data["power_source"] = "battery"
    pct = re.search(r"(\d+)%", batt)
    if pct:
        data["battery_pct"] = int(pct.group(1))

    _, assertions, _ = run(["pmset", "-g", "assertions"], timeout=6)
    # 防止休眠的断言太多时也可能卡
    prevent = [ln.strip() for ln in assertions.splitlines() if "PreventUserIdleSystemSleep" in ln and "1" in ln]
    data["prevent_sleep_count"] = len(prevent)

    _, mode, _ = run(["pmset", "-g"])
    low = re.search(r"lowpowermode\s+(\d+)", mode)
    if low:
        data["low_power_mode"] = low.group(1) == "1"
    return data


def collect_macos_background() -> dict[str, Any]:
    data: dict[str, Any] = {}
    if platform.system() != "Darwin":
        return data
    _, md, _ = run(["mdutil", "-s", "/"])
    data["spotlight"] = " ".join(md.split())
    data["spotlight_on"] = "enabled" in md.lower() or "打开" in md

    _, tm, _ = run(["tmutil", "status"], timeout=8)
    data["timemachine_running"] = bool(re.search(r"Running\s*=\s*1", tm))
    data["timemachine_raw"] = "\n".join(tm.splitlines()[:12])

    code, snaps, _ = run(["tmutil", "listlocalsnapshots", "/"], timeout=8)
    if code == 0:
        lines = [ln.strip() for ln in snaps.splitlines() if ln.strip()]
        data["local_snapshots"] = [ln for ln in lines if "snapshot" in ln.lower() or "com.apple" in ln]
        data["snapshot_count"] = len(data["local_snapshots"])
    else:
        data["snapshot_count"] = None

    _, login, _ = run(
        [
            "osascript",
            "-e",
            'tell application "System Events" to get the name of every login item',
        ],
        timeout=8,
    )
    if login.strip() and "error" not in login.lower():
        items = [x.strip() for x in login.split(",") if x.strip()]
        data["login_items"] = items
    else:
        data["login_items"] = []

    def list_plists(folder: Path) -> list[Path]:
        try:
            return sorted(folder.glob("*.plist"))
        except OSError:
            return []

    user_agents = list_plists(Path.home() / "Library/LaunchAgents")
    lib_agents = list_plists(Path("/Library/LaunchAgents"))
    lib_daemons = list_plists(Path("/Library/LaunchDaemons"))
    third_party = [
        p for p in (*user_agents, *lib_agents, *lib_daemons) if not p.name.startswith("com.apple.")
    ]
    data["user_launch_agents"] = [p.name for p in user_agents]
    data["third_party_launch"] = [p.name for p in third_party]
    data["third_party_count"] = len(third_party)
    data["launch_count"] = len(user_agents)  # 只把用户级 LaunchAgent 当「开机项」

    if which("brew"):
        code, brew, _ = run(["brew", "services", "list"], timeout=10)
        if code == 0:
            started = [
                ln
                for ln in brew.splitlines()[1:]
                if ln.strip() and re.search(r"\bstarted\b", ln)
            ]
            data["brew_started"] = started
    return data


def collect_network(quick: bool) -> dict[str, Any]:
    data: dict[str, Any] = {"ok": None, "ping_ms": None}
    if quick:
        return data
    ping = "ping"
    args = [ping, "-c", "2", "-W", "2000", "1.1.1.1"]
    if platform.system() == "Darwin":
        args = [ping, "-c", "2", "-W", "2000", "1.1.1.1"]
    code, out, err = run(args, timeout=8)
    data["ok"] = code == 0
    m = re.search(r"time[=<]([\d.]+)\s*ms", out)
    if m:
        data["ping_ms"] = parse_float(m.group(1))
    avg = re.search(r"min/avg/max(?:/[a-z]+)?\s*=\s*[\d.]+/([\d.]+)", out)
    if avg:
        data["ping_ms"] = parse_float(avg.group(1))
    if not data["ok"]:
        data["error"] = first_line(err or out)
    return data


def collect_listeners() -> list[str]:
    """开发机上堆着的本地服务（vite/node）也会拖慢机器。"""
    if platform.system() == "Darwin":
        code, out, _ = run(["lsof", "-nP", "-iTCP", "-sTCP:LISTEN"], timeout=8)
    else:
        code, out, _ = run(["ss", "-lnt"], timeout=6)
        if code != 0:
            code, out, _ = run(["netstat", "-lnt"], timeout=6)
    if code != 0:
        return []
    lines = [ln.strip() for ln in out.splitlines()[1:] if ln.strip()]
    return lines[:80]


# ---------------------------------------------------------------------------
# 诊断
# ---------------------------------------------------------------------------

def group_procs(procs: list[Proc]) -> dict[str, dict[str, float | int]]:
    groups: dict[str, dict[str, float | int]] = {}
    for p in procs:
        g = groups.setdefault(p.family, {"cpu": 0.0, "rss_mb": 0.0, "count": 0})
        g["cpu"] = float(g["cpu"]) + p.cpu
        g["rss_mb"] = float(g["rss_mb"]) + p.rss_mb
        g["count"] = int(g["count"]) + 1
    return groups


def diagnose(snapshot: dict[str, Any]) -> list[Finding]:
    findings: list[Finding] = []
    sysinfo: dict[str, Any] = snapshot["system"]
    cpu: dict[str, Any] = snapshot["cpu"]
    mem: dict[str, Any] = snapshot["memory"]
    disk: dict[str, Any] = snapshot["disk"]
    io: dict[str, Any] = snapshot["io"]
    procs: list[Proc] = snapshot["processes"]
    thermal: dict[str, Any] = snapshot["thermal"]
    bg: dict[str, Any] = snapshot["background"]
    ncpu = max(int(sysinfo.get("ncpu") or 1), 1)
    load = sysinfo.get("loadavg") or [0, 0, 0]
    load1 = float(load[0])
    load_ratio = load1 / ncpu
    groups = group_procs(procs)
    top_cpu = sorted(procs, key=lambda p: p.cpu, reverse=True)[:12]
    top_rss = sorted(procs, key=lambda p: p.rss_mb, reverse=True)[:12]
    top_groups_cpu = sorted(groups.items(), key=lambda kv: float(kv[1]["cpu"]), reverse=True)[:8]
    top_groups_rss = sorted(groups.items(), key=lambda kv: float(kv[1]["rss_mb"]), reverse=True)[:8]

    # --- CPU ---
    cpu_details = [
        f"负载：1m={load[0]:.2f}  5m={load[1]:.2f}  15m={load[2]:.2f}  （{ncpu} 逻辑核，1 分钟负载/核 = {load_ratio:.2f}）",
    ]
    if cpu.get("user") is not None:
        cpu_details.append(
            f"瞬时占用：user {cpu['user']:.1f}%  sys {cpu['sys']:.1f}%  idle {cpu['idle']:.1f}%"
        )
    cpu_details.append("按进程族合计 CPU：")
    for name, g in top_groups_cpu[:6]:
        if float(g["cpu"]) < 3:
            continue
        cpu_details.append(f"  · {name}: {g['cpu']:.1f}%  ({g['count']} 个进程)")
    cpu_details.append("单个进程 TOP：")
    for p in top_cpu[:6]:
        if p.cpu < 3:
            continue
        cpu_details.append(f"  · pid {p.pid:>6}  {p.cpu:5.1f}%  {short_cmd(p.command, 64)}")

    cpu_sugg: list[str] = []
    cpu_level = "ok"
    cpu_score = 0
    cpu_title = "CPU 负载正常"
    if load_ratio >= 1.8 or (cpu.get("idle") is not None and cpu["idle"] < 8):
        cpu_level, cpu_score, cpu_title = "crit", 32, "CPU 严重过载"
        cpu_sugg = [
            "先结束占用最高的几个进程（活动监视器 → CPU），不要一次开太多开发服务。",
            "前端仓库避免同时跑多套 `pnpm dev` / turbo；不用的 Node 进程清掉。",
            "Chrome 只留当前需要的窗口；每个标签都是独立进程。",
        ]
    elif load_ratio >= 1.05 or (cpu.get("idle") is not None and cpu["idle"] < 25):
        cpu_level, cpu_score, cpu_title = "warn", 16, "CPU 持续偏高"
        cpu_sugg = [
            "关掉暂时不用的 IDE 窗口、浏览器配置文件、本地后端。",
            "如果正在编译/索引，等它跑完会明显好转。",
        ]
    elif load_ratio >= 0.7:
        cpu_level, cpu_score, cpu_title = "info", 4, "CPU 有一定压力"
        cpu_sugg = ["当前还能用，但再开新的重任务（Docker、完整构建）会开始卡。"]

    # 针对具体进程族加建议
    def group_cpu(name: str) -> float:
        return float(groups.get(name, {}).get("cpu") or 0)

    if group_cpu("Spotlight 索引") >= 25:
        cpu_sugg.append(
            "Spotlight 正在狂扫磁盘（mds_stores）。可在「系统设置 → Siri 与聚焦 → 聚焦隐私」把体积巨大的目录（node_modules、dist、.git）加进隐私，或等索引结束。"
        )
        cpu_level = max(cpu_level, "warn", key=lambda x: LEVEL_RANK[x])
        cpu_score = max(cpu_score, 18)
    if group_cpu("Time Machine") >= 15:
        cpu_sugg.append("Time Machine 正在备份。备份窗口内会卡，可改到空闲时段，或暂停备份试一下是否立刻流畅。")
    if group_cpu("Google Chrome") >= 40:
        cpu_sugg.append("Chrome 占用过高：关掉不用的标签/扩展，或换用单独的工作配置文件，少装广告拦截以外的扩展。")
    if group_cpu("Cursor") + group_cpu("VS Code") >= 50:
        cpu_sugg.append(
            "编辑器 Helper 过多：减少同时打开的大仓库、关掉没用的扩展（尤其多语言语言服务一起开），文件监视排除 node_modules。"
        )
    if group_cpu("Node / 前端工具链") >= 40:
        cpu_sugg.append(
            "本机 Node/Vite/Turbo 进程过多。用 `lsof -nP -iTCP -sTCP:LISTEN | grep node` 看开了哪些端口，停掉不用的 dev server。"
        )
    if group_cpu("Docker") >= 20:
        cpu_sugg.append("Docker Desktop 很吃资源。不用容器时退出 Docker，并在设置里限制 CPU/内存上限。")
    if group_cpu("kernel_task") >= 40:
        cpu_sugg.append(
            "kernel_task 飙高通常是散热保护：把电脑垫高、清灰、拔掉耗电配件；Intel 机可考虑重置 SMC。不要强制杀 kernel_task。"
        )
        cpu_level, cpu_score = "crit", max(cpu_score, 28)
        cpu_title = "疑似过热降频（kernel_task 很高）"
    if group_cpu("WindowServer") >= 40:
        cpu_sugg.append(
            "WindowServer 高：减少外接屏数量/分辨率、关掉「真彩/透明效果」、少开全屏空间，或重启一次窗口服务（注销再登入）。"
        )

    findings.append(
        Finding("CPU", cpu_level, cpu_title, cpu_details, cpu_sugg, cpu_score)
    )

    # --- Memory ---
    mem_bytes = sysinfo.get("mem_bytes") or 0
    swap_used = float(mem.get("swap_used") or 0)
    swap_total = float(mem.get("swap_total") or 0)
    pressure = mem.get("pressure")
    b = mem.get("bytes") or {}
    mem_details = []
    if mem_bytes:
        mem_details.append(f"物理内存：{bytes_human(mem_bytes)}")
    if pressure:
        mem_details.append(f"内存压力（Memory Pressure）：{pressure}")
    if b:
        if b.get("wired") is not None:
            mem_details.append(
                f"Wired {bytes_human(b.get('wired', 0))}  "
                f"Anonymous {bytes_human(b.get('anonymous', 0))}  "
                f"File-backed {bytes_human(b.get('file_backed', 0))}  "
                f"Compressor {bytes_human(b.get('compressor_occupied', 0))}  "
                f"Free {bytes_human(b.get('free', 0))}"
            )
        if b.get("available") is not None:
            mem_details.append(
                f"Available {bytes_human(b.get('available', 0))} / Total {bytes_human(b.get('total', 0))}"
            )
    mem_details.append(f"交换区 Swap：已用 {bytes_human(swap_used)} / 总共 {bytes_human(swap_total)}")
    if mem.get("swapouts"):
        mem_details.append(f"累计 Swapouts={mem.get('swapouts')}  Swapins={mem.get('swapins')}  Pageouts={mem.get('pageouts')}")
    mem_details.append("按进程族合计内存：")
    for name, g in top_groups_rss[:6]:
        if float(g["rss_mb"]) < 200:
            continue
        mem_details.append(f"  · {name}: {g['rss_mb']:.0f} MB  ({g['count']} 个进程)")
    mem_details.append("单个进程 RSS TOP：")
    for p in top_rss[:6]:
        mem_details.append(f"  · pid {p.pid:>6}  {p.rss_mb:7.0f} MB  {short_cmd(p.command, 60)}")

    mem_level, mem_score, mem_title = "ok", 0, "内存压力正常"
    mem_sugg: list[str] = []
    ram_gb = (mem_bytes or 0) / (1024**3)

    if pressure == "critical" or swap_used >= 2 * 1024**3:
        mem_level, mem_score, mem_title = "crit", 36, "内存严重不足，正在疯狂换页"
        mem_sugg = [
            "这是卡顿最常见的原因之一：内存不够就写到磁盘（Swap），整机都会「粘滞」。",
            "立刻退出占用最大的 App（下面 RSS TOP），尤其是 Chrome / Docker / 多个 IDE 窗口。",
            "重启一次最能快速释放内存泄漏（Electron 系 App 用久了特别明显）。",
        ]
        if ram_gb and ram_gb <= 8.5:
            mem_sugg.append("这台机器内存偏小（≤8GB），日常浏览器 + IDE + 本地服务很容易顶满，优先减少同时开的大应用。")
        elif ram_gb and ram_gb <= 16.5:
            mem_sugg.append(
                "16GB 在「IDE + Chrome + 聊天软件」组合下很容易顶满。不要同时开 Cursor 和 VS Code；IM 只留一个；浏览器只留一个内核（Chrome 或 QQ 浏览器二选一）。"
            )
        mem_sugg.append("Swapouts 已经非常高，说明这几天一直在用硬盘冒充内存。关掉大应用后重启一次，比继续硬撑有效得多。")
    elif pressure == "warn" or swap_used >= 256 * 1024**2:
        mem_level, mem_score, mem_title = "warn", 20, "内存开始吃紧，已经动用 Swap"
        mem_sugg = [
            "Swap 一旦开始增长，操作会有延迟感。先关掉不用的浏览器配置文件和 Docker。",
            "Cursor/VS Code 不要同时开太多仓库窗口。",
        ]
    elif (b.get("compressor_occupied") or 0) > 1.5 * 1024**3:
        mem_level, mem_score, mem_title = "info", 8, "内存压缩较多，再开应用容易变卡"
        mem_sugg = ["macOS 正在压缩内存硬撑。先不要再开新的重应用。"]
    else:
        mem_sugg = ["空闲内存低并不等于缺内存（macOS 会尽量用来缓存文件）。真正要看的是压力状态和 Swap。"]

    if float(groups.get("Google Chrome", {}).get("rss_mb") or 0) >= 2500:
        mem_sugg.append("Chrome 已吃掉数 GB：少开标签，或定期「shift+esc」任务管理器杀掉挂起页。")
    if float(groups.get("QQ浏览器", {}).get("rss_mb") or 0) >= 800:
        mem_sugg.append("QQ 浏览器和 Chrome 不要同时当主力，两个都是 Chromium，等于开了两套浏览器内核。")
    if float(groups.get("Docker", {}).get("rss_mb") or 0) >= 1500:
        mem_sugg.append("给 Docker Desktop 设内存上限（设置 → Resources），不用时完全退出而不是只关窗口。")
    if float(groups.get("企业安全/VPN", {}).get("rss_mb") or 0) >= 300:
        mem_sugg.append("企业安全客户端（如 CorpLink）会常驻内存，这是公司电脑的固定开销，只能靠少开其他 App 来腾地方。")

    heavy_names = (
        "Google Chrome",
        "QQ浏览器",
        "Cursor",
        "VS Code",
        "Slack",
        "飞书 / Lark",
        "微信",
        "钉钉",
        "Docker",
        "Safari",
        "Firefox",
    )
    heavy_running = [
        (name, groups[name])
        for name in heavy_names
        if name in groups and (float(groups[name]["rss_mb"]) >= 250 or int(groups[name]["count"]) >= 3)
    ]
    if len(heavy_running) >= 4:
        detail = "、".join(f"{n} {g['rss_mb']:.0f}MB/{g['count']}进程" for n, g in heavy_running)
        mem_sugg.append(f"同时在跑的重应用过多：{detail}。先退出现在不用的，比「优化系统设置」更立竿见影。")

    findings.append(Finding("内存", mem_level, mem_title, mem_details, mem_sugg, mem_score))

    # --- Disk ---
    volumes = disk.get("volumes") or []
    vol = next((v for v in volumes if "Data" in str(v.get("mount", ""))), None)
    if vol is None:
        vol = volumes[0] if volumes else {}
    used_pct = float(vol.get("used_pct") or 0)
    avail = float(vol.get("avail") or 0)
    total = float(vol.get("total") or 0)
    # APFS 以容器空闲为准（系统卷的 df 会看起来「很空」）
    if disk.get("container_total") and disk.get("container_free") is not None:
        total = float(disk["container_total"])
        avail = float(disk["container_free"])
        used_pct = (1.0 - avail / total) * 100 if total else used_pct
    disk_details = []
    if vol:
        disk_details.append(
            f"数据卷 {vol.get('mount', '/')}：已用 {float(vol.get('used_pct') or 0):.0f}%  "
            f"（可用 {bytes_human(float(vol.get('avail') or 0))}）"
        )
    if disk.get("container_total"):
        disk_details.append(
            f"APFS 容器：已用 {used_pct:.0f}%  "
            f"（可用 {bytes_human(avail)} / 共 {bytes_human(total)}）"
        )
    inodes = disk.get("inodes") or {}
    if inodes:
        disk_details.append(f"inode 使用率：{inodes.get('used_pct', 0):.0f}%（{inodes.get('mount', '')}）")
    if disk.get("filevault"):
        disk_details.append(f"FileVault：{disk['filevault']}")
    if io.get("tps") is not None:
        disk_details.append(f"瞬时磁盘：{io.get('tps'):.0f} tps  {io.get('mb_s'):.1f} MB/s")

    disk_level, disk_score, disk_title = "ok", 0, "磁盘空间充足"
    disk_sugg: list[str] = []
    if used_pct >= 95 or avail < 5 * 1024**3:
        disk_level, disk_score, disk_title = "crit", 30, "启动盘几乎写满，系统会极度卡顿"
        disk_sugg = [
            "SSD 接近满盘时 APFS 无法正常做磨损均衡和暂存，表现为开 App 都慢。至少腾出 15–20% 或 20GB+。",
            "清：废纸篓、下载、Docker 镜像（`docker system prune -a`）、Xcode DerivedData、旧 iOS 备份、~/.npm/_cacache。",
            "把电影/虚拟机/节点模块缓存移到外盘。不要删 /System。",
        ]
    elif used_pct >= 90 or avail < 15 * 1024**3:
        disk_level, disk_score, disk_title = "warn", 16, "磁盘偏满，写入会变慢"
        disk_sugg = [
            "建议保持 15% 以上空闲。可先清「系统设置 → 通用 → 储存空间」里的废纸篓、缓存、重复文件。",
            "开发目录里的 `node_modules`、`dist`、`.turbo` 很占空间，不用的项目可删依赖后按需再装。",
        ]
    elif used_pct >= 80:
        disk_level, disk_score, disk_title = "info", 4, "磁盘使用率偏高"
        disk_sugg = ["还有余量，但再装几个模拟器/镜像就会顶到黄线。"]

    inode_pct = float(inodes.get("used_pct") or 0)
    if inode_pct >= 85:
        disk_sugg.append("inode 快用尽（小文件极多，常见于无数 node_modules）。清掉不用的项目依赖。")
        disk_level = max(disk_level, "warn", key=lambda x: LEVEL_RANK[x])
        disk_score = max(disk_score, 14)

    if io.get("tps") and io["tps"] > 400:
        if swap_used >= 512 * 1024**2:
            disk_sugg.append(
                "磁盘 IOPS 很高，同时 Swap 很大——这是内存换页在打硬盘，整机会「粘一下顿一下」。先腾内存，而不是先怪磁盘。"
            )
            disk_level = max(disk_level, "warn", key=lambda x: LEVEL_RANK[x])
            disk_score = max(disk_score, 10)
        elif (cpu.get("idle") or 100) > 30:
            disk_sugg.append("当前磁盘 IOPS 很高，可能正在索引/备份/同步。等后台任务结束再判断是不是「一直卡」。")
            disk_level = max(disk_level, "info", key=lambda x: LEVEL_RANK[x])

    findings.append(Finding("磁盘", disk_level, disk_title, disk_details, disk_sugg, disk_score))

    # --- Thermal / power ---
    th_details = []
    if thermal.get("cpu_speed_limit") is not None:
        th_details.append(f"CPU_Speed_Limit = {thermal['cpu_speed_limit']}%")
    if thermal.get("power_source"):
        src = "电源适配器" if thermal["power_source"] == "ac" else "电池"
        extra = f"（电量 {thermal['battery_pct']}%）" if thermal.get("battery_pct") is not None else ""
        th_details.append(f"供电：{src}{extra}")
    if thermal.get("low_power_mode"):
        th_details.append("低电量模式：已开启")
    if thermal.get("bg_disabled"):
        th_details.append("后台任务因热管理被禁用")
    if thermal.get("therm_raw"):
        raw = thermal["therm_raw"]
        if raw:
            th_details.append("pmset therm 摘要：")
            th_details.extend(f"  {ln}" for ln in raw.splitlines()[:8])

    th_level, th_score, th_title = "ok", 0, "未检测到明显降频"
    th_sugg: list[str] = []
    limit = thermal.get("cpu_speed_limit")
    if limit is not None and limit < 70:
        th_level, th_score, th_title = "crit", 28, f"CPU 被限制在 {limit}%（过热或电源策略）"
        th_sugg = [
            "电脑在主动降频，体感就是「突然变得好卡」。放在硬平面、别堵住进风口，卸下厚保护壳。",
            "拔掉总线供电的扩展坞/硬盘试一下；Intel Mac 可关机后重置 SMC。",
        ]
    elif limit is not None and limit < 100:
        th_level, th_score, th_title = "warn", 14, f"CPU 被限制在 {limit}%"
        th_sugg = ["轻微降频。检查是否在晒太阳/毯子上，或后台有备份。"]
    if thermal.get("low_power_mode") and thermal.get("power_source") == "battery":
        th_sugg.append("电池 + 低电量模式会显著砍性能。插电并关掉低电量模式再评估。")
        th_level = max(th_level, "info", key=lambda x: LEVEL_RANK[x])
        th_score = max(th_score, 6)
    if thermal.get("power_source") == "battery" and (thermal.get("battery_pct") or 100) <= 20:
        th_sugg.append("电量很低时 macOS 会更激进地省电。先插电。")

    if sysinfo.get("rosetta"):
        th_details.append("当前自检进程运行在 Rosetta（x86 转译）下。若这是 Apple 芯片机器，部分软件若也走转译会更耗电更卡。")
        th_sugg.append("Apple 芯片上尽量用原生 arm64 版 App（Chrome、Docker、Node 都选 ARM 版）。")

    findings.append(Finding("散热/电源", th_level, th_title, th_details or ["未获取到热管理数据（无 sudo 时正常）。"], th_sugg, th_score))

    # --- Background jobs ---
    bg_details = []
    bg_sugg: list[str] = []
    bg_level, bg_score, bg_title = "ok", 0, "后台任务未见异常"

    if bg.get("spotlight"):
        bg_details.append(f"Spotlight：{first_line(bg['spotlight'])}")
    if bg.get("timemachine_running"):
        bg_details.append("Time Machine：正在备份")
        bg_level, bg_score, bg_title = "warn", 12, "Time Machine 正在备份，会明显拖慢磁盘"
        bg_sugg.append("备份期间卡顿是预期现象。可在菜单栏时间机器图标里跳过当前备份对比。")
    if bg.get("snapshot_count"):
        bg_details.append(f"本地 APFS 快照：{bg['snapshot_count']} 个")
        if bg["snapshot_count"] >= 8:
            bg_sugg.append(
                "本地快照会占容器空间。可 `tmutil listlocalsnapshots /` 查看；空间不足时用 `tmutil thinlocalsnapshots / 10000000000 4` 精简（先确认没有正在恢复）。"
            )
            bg_level = max(bg_level, "info", key=lambda x: LEVEL_RANK[x])
            bg_score = max(bg_score, 5)

    login_items = bg.get("login_items") or []
    bg_details.append(f"登录项：{len(login_items)} 个" + (f"（{', '.join(login_items[:8])}）" if login_items else ""))
    user_agents = bg.get("user_launch_agents") or []
    third = bg.get("third_party_launch") or []
    bg_details.append(f"用户 LaunchAgents：{len(user_agents)} 个" + (f"（{', '.join(user_agents[:6])}）" if user_agents else ""))
    if third:
        bg_details.append(f"第三方 LaunchAgent/Daemon：{len(third)} 个（{', '.join(third[:8])}{'…' if len(third) > 8 else ''}）")
    brew_started = bg.get("brew_started") or []
    if brew_started:
        bg_details.append("Homebrew 正在运行的服务：")
        bg_details.extend(f"  · {ln}" for ln in brew_started[:10])

    if len(login_items) >= 8 or len(user_agents) >= 8:
        bg_level = max(bg_level, "warn", key=lambda x: LEVEL_RANK[x])
        bg_score = max(bg_score, 10)
        bg_title = "开机启动项偏多，内存和 CPU 会被常驻软件咬掉"
        bg_sugg.append("系统设置 → 通用 → 登录项，关掉不需要的；第三方更新器、网盘、输入法助手只留一个。")
    elif len(third) >= 12:
        bg_level = max(bg_level, "info", key=lambda x: LEVEL_RANK[x])
        bg_score = max(bg_score, 4)
        bg_sugg.append("第三方常驻项不少（含公司安全客户端）。能关的更新器/网盘可以关，公司客户端一般不要动。")
    joined_agents = " ".join(user_agents + third).lower()
    if "mongodb" in joined_agents:
        bg_sugg.append("检测到 MongoDB 开机自启。不用数据库时执行 `brew services stop mongodb-community`。")
    if "watchman" in joined_agents:
        bg_sugg.append("Watchman 会监视海量文件，大前端仓库会更卡。不用 Metro/React Native 时可以 `brew services stop watchman`。")
    if "netdisk" in joined_agents:
        bg_sugg.append("网盘同步会常驻并抢磁盘 I/O，不用时从菜单栏退出。")
    if brew_started:
        bg_sugg.append("不用的 `brew services` 用 `brew services stop <name>` 停掉（数据库、Redis、nginx 常被忘掉）。")

    # listeners
    listeners: list[str] = snapshot.get("listeners") or []
    node_listen = [ln for ln in listeners if re.search(r"\bnode\b|vite|python|deno|java", ln, re.I)]
    if len(node_listen) >= 8:
        bg_details.append(f"本机正在监听的开发服务相关连接约 {len(node_listen)} 条（可能开了太多 dev server）")
        bg_sugg.append("把不用的本地服务停掉。Vite/Webpack 的文件监听在大仓库里非常吃 CPU。")
        bg_level = max(bg_level, "info", key=lambda x: LEVEL_RANK[x])
        bg_score = max(bg_score, 8)

    findings.append(Finding("后台/启动项", bg_level, bg_title, bg_details, bg_sugg, bg_score))

    # --- 系统概况提示 ---
    info_details = []
    up = sysinfo.get("uptime_sec")
    if up:
        days, rem = divmod(int(up), 86400)
        hours, rem = divmod(rem, 3600)
        mins = rem // 60
        info_details.append(f"已开机 {days} 天 {hours} 小时 {mins} 分钟")
        if up > 7 * 86400:
            findings.append(
                Finding(
                    "系统",
                    "info",
                    "已经连续开机超过一周",
                    info_details,
                    ["Electron 应用（Chrome/Cursor/微信）内存会慢慢涨。卡很久了就重启一次，往往立刻好一截。"],
                    4,
                )
            )
        elif up > 3 * 86400:
            findings.append(
                Finding(
                    "系统",
                    "ok",
                    f"已连续开机 {days} 天",
                    info_details,
                    ["若感觉一天比一天顿，可以抽空重启。"],
                    0,
                )
            )

    net = snapshot.get("network") or {}
    if net.get("ok") is False:
        findings.append(
            Finding(
                "网络",
                "info",
                "外网探测失败（不一定是卡顿主因）",
                [net.get("error") or "ping 1.1.1.1 失败"],
                ["若只是网页慢而本地 App 也卡，优先看 CPU/内存而不是网络。"],
                2,
            )
        )
    elif net.get("ping_ms") is not None:
        findings.append(
            Finding(
                "网络",
                "ok" if net["ping_ms"] < 80 else "info",
                f"外网 RTT 约 {net['ping_ms']:.0f} ms",
                [],
                ["网络延迟几乎不会让「整个 macOS 操作都卡」，除非你在等网盘/远程盘。"],
                0 if net["ping_ms"] < 80 else 2,
            )
        )

    return findings


def overall(findings: list[Finding]) -> tuple[str, int, str]:
    score = sum(f.score for f in findings)
    worst = max((LEVEL_RANK[f.level] for f in findings), default=0)
    if worst >= 3 or score >= 40:
        level = "crit"
        summary = "当前机器压力很大，卡顿是系统资源被打满的结果，建议马上按下面「严重/警告」项处理。"
    elif worst >= 2 or score >= 18:
        level = "warn"
        summary = "已经出现明显瓶颈。先处理警告项，一般能立刻感到顺畅一些。"
    elif worst >= 1 or score >= 6:
        level = "info"
        summary = "整体还能用，但有一些隐患；再堆任务就容易开始卡。"
    else:
        level = "ok"
        summary = "这次采样没有看到明显的资源打满。若仍然卡，多半是偶发后台任务或单个 App 卡住，可在卡的当下再跑一次。"
    return level, score, summary


def root_causes(findings: list[Finding]) -> list[Finding]:
    return sorted(
        [f for f in findings if f.level in {"warn", "crit"} or f.score >= 8],
        key=lambda f: (-LEVEL_RANK[f.level], -f.score),
    )[:5]


# ---------------------------------------------------------------------------
# 渲染
# ---------------------------------------------------------------------------

def render_terminal(sysinfo: dict[str, Any], findings: list[Finding], saved: Path | None) -> str:
    level, score, summary = overall(findings)
    causes = root_causes(findings)
    bar = "═" * 64
    lines: list[str] = []
    lines.append(f"{C.bold}{C.cyan}╔{bar}╗{C.reset}")
    lines.append(f"{C.bold}{C.cyan}║  电脑自检报告  v{VERSION:<8}  {sysinfo.get('now', ''):<36}║{C.reset}")
    lines.append(f"{C.bold}{C.cyan}╚{bar}╝{C.reset}")
    lines.append("")

    model = sysinfo.get("model_name") or sysinfo.get("model") or platform.platform()
    cpu_brand = sysinfo.get("cpu_brand") or ""
    mem = bytes_human(sysinfo["mem_bytes"]) if sysinfo.get("mem_bytes") else "?"
    os_name = sysinfo.get("macos_version") or f"{sysinfo.get('os')} {sysinfo.get('os_release')}"
    lines.append(f"{C.bold}机器{C.reset}  {model}  ·  {cpu_brand}")
    lines.append(
        f"      {os_name}  ·  {sysinfo.get('arch')}  ·  {sysinfo.get('ncpu')} 核  ·  内存 {mem}  ·  {sysinfo.get('hostname')}"
    )
    if sysinfo.get("apple_silicon"):
        extra = "（当前 Python 走 Rosetta 转译）" if sysinfo.get("rosetta") else ""
        lines.append(f"      Apple 芯片{extra}")
    lines.append("")

    badge = LEVEL_COLOR[level](f"[{LEVEL_CN[level]}]")
    lines.append(f"{C.bold}总评{C.reset}  {badge}  压力分 {score}")
    lines.append(f"      {summary}")
    lines.append("")

    if causes:
        lines.append(f"{C.bold}最可能的卡顿原因{C.reset}")
        for i, f in enumerate(causes, 1):
            tag = LEVEL_COLOR[f.level](LEVEL_CN[f.level])
            lines.append(f"  {i}. [{tag}] {f.category} — {f.title}")
        lines.append("")
    else:
        lines.append(f"{C.green}没有突出的单一元凶。{C.reset}")
        lines.append("")

    for f in findings:
        tag = LEVEL_COLOR[f.level](f"{LEVEL_CN[f.level]}")
        lines.append(f"{C.bold}▸ {f.category}{C.reset}  {tag}  {f.title}")
        for d in f.details:
            lines.append(f"    {C.dim}{d}{C.reset}")
        if f.suggestions:
            lines.append(f"    {C.yellow}建议：{C.reset}")
            for s in f.suggestions:
                lines.append(f"      • {s}")
        lines.append("")

    lines.append(f"{C.dim}说明：空闲内存低在 macOS 上通常正常；真正危险的是内存压力/Swap、磁盘满、过热降频、Spotlight 全盘扫描。{C.reset}")
    if saved:
        lines.append(f"{C.dim}报告已保存：{saved}{C.reset}")
    lines.append("")
    return "\n".join(lines)


def render_markdown(sysinfo: dict[str, Any], findings: list[Finding]) -> str:
    level, score, summary = overall(findings)
    causes = root_causes(findings)
    model = sysinfo.get("model_name") or sysinfo.get("model") or platform.platform()
    lines = [
        f"# 电脑自检报告",
        "",
        f"- 时间：{sysinfo.get('now')}",
        f"- 机器：{model} / {sysinfo.get('cpu_brand') or ''} / {sysinfo.get('arch')} / {sysinfo.get('ncpu')} 核 / 内存 {bytes_human(sysinfo.get('mem_bytes') or 0)}",
        f"- 系统：{sysinfo.get('macos_version') or sysinfo.get('os')}",
        f"- 总评：**{LEVEL_CN[level]}**（压力分 {score}）",
        f"- {summary}",
        "",
        "## 最可能的卡顿原因",
        "",
    ]
    if causes:
        for i, f in enumerate(causes, 1):
            lines.append(f"{i}. **[{LEVEL_CN[f.level]}]** {f.category} — {f.title}")
    else:
        lines.append("没有突出的单一元凶。")
    lines.append("")
    for f in findings:
        lines.append(f"## {f.category} · {LEVEL_CN[f.level]} · {f.title}")
        lines.append("")
        for d in f.details:
            lines.append(f"- {d}")
        if f.suggestions:
            lines.append("")
            lines.append("**建议**")
            lines.append("")
            for s in f.suggestions:
                lines.append(f"- {s}")
        lines.append("")
    lines.append("---")
    lines.append(f"由 other/self_check v{VERSION} 生成。")
    lines.append("")
    return "\n".join(lines)


def findings_json(findings: list[Finding]) -> list[dict[str, Any]]:
    return [asdict(f) for f in findings]


def findings_from_dicts(rows: list[dict[str, Any]]) -> list[Finding]:
    out: list[Finding] = []
    for row in rows:
        out.append(
            Finding(
                category=str(row.get("category") or ""),
                level=str(row.get("level") or "info"),
                title=str(row.get("title") or ""),
                details=list(row.get("details") or []),
                suggestions=list(row.get("suggestions") or []),
                score=int(row.get("score") or 0),
            )
        )
    return out


# ---------------------------------------------------------------------------
# 历史记录 / 给桌面应用复用的入口
# ---------------------------------------------------------------------------

def in_app_bundle() -> bool:
    return os.environ.get("SELFCHECK_APP") == "1" or "Contents/Resources" in str(HERE)


def history_dir() -> Path:
    override = os.environ.get("SELFCHECK_HISTORY")
    if override:
        path = Path(override)
    elif sys.platform == "darwin":
        path = Path.home() / "Library" / "Application Support" / APP_ID / "history"
    else:
        path = Path.home() / ".local" / "share" / "self-check" / "history"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _fallback_sysinfo() -> dict[str, Any]:
    return {
        "os": platform.system(),
        "os_release": platform.release(),
        "arch": platform.machine(),
        "hostname": socket.gethostname(),
        "python": platform.python_version(),
        "now": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "ncpu": os.cpu_count() or 1,
        "loadavg": [0.0, 0.0, 0.0],
        "mem_bytes": None,
    }


def collect_with_progress(
    quick: bool = False,
    on_progress: Any | None = None,
) -> tuple[dict[str, Any], list[Finding]]:
    def note(step: str, message: str) -> None:
        if on_progress:
            on_progress(step, message)

    def safe(name: str, fn, fallback):
        try:
            return fn()
        except Exception as exc:  # noqa: BLE001
            note("error", f"采集 {name} 失败：{exc}")
            return fallback

    note("system", "正在读取本机信息…")
    sysinfo = safe("system", collect_system, _fallback_sysinfo())
    note("processes", "正在统计进程占用…")
    procs = safe("processes", collect_processes, [])
    note("cpu", "正在采样 CPU…")
    cpu = safe("cpu", lambda: collect_cpu_sample(quick), {})
    note("memory", "正在检查内存与 Swap…")
    memory = safe("memory", collect_memory, {})
    note("disk", "正在检查磁盘空间…")
    disk = safe("disk", collect_disk, {"volumes": []})
    note("io", "正在采样磁盘 I/O…" if not quick else "已跳过磁盘 I/O 采样")
    io = safe("io", lambda: collect_iostat(quick), {})
    note("thermal", "正在读取散热与电源…")
    thermal = safe("thermal", collect_thermal, {})
    note("background", "正在检查启动项与后台任务…")
    background = safe("background", collect_macos_background, {})
    note("network", "正在探测网络…" if not quick else "已跳过网络探测")
    network = safe("network", lambda: collect_network(quick), {})
    note("listeners", "正在查看本机监听端口…")
    listeners = safe("listeners", collect_listeners, [])
    snapshot: dict[str, Any] = {
        "system": sysinfo,
        "cpu": cpu,
        "memory": memory,
        "disk": disk,
        "io": io,
        "processes": procs,
        "thermal": thermal,
        "background": background,
        "network": network,
        "listeners": listeners,
    }
    note("diagnose", "正在分析卡顿原因…")
    findings = diagnose(snapshot)
    return sysinfo, findings


def build_report(sysinfo: dict[str, Any], findings: list[Finding]) -> dict[str, Any]:
    level, score, summary = overall(findings)
    causes = root_causes(findings)
    report_id = datetime.now().strftime("%Y%m%d-%H%M%S")
    machine = sysinfo.get("model_name") or sysinfo.get("model") or platform.platform()
    return {
        "version": VERSION,
        "id": report_id,
        "saved_at": sysinfo.get("now"),
        "system": sysinfo,
        "machine": machine,
        "overall": {
            "level": level,
            "level_cn": LEVEL_CN.get(level, level),
            "score": score,
            "summary": summary,
        },
        "causes": findings_json(causes),
        "findings": findings_json(findings),
    }


def save_report(
    report: dict[str, Any],
    findings: list[Finding] | None = None,
    also_local: bool = False,
) -> Path:
    hid = str(report.get("id") or datetime.now().strftime("%Y%m%d-%H%M%S"))
    report["id"] = hid
    dest = history_dir() / f"{hid}.json"
    dest.write_text(json.dumps(report, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    found = findings if findings is not None else findings_from_dicts(list(report.get("findings") or []))
    md_text = render_markdown(dict(report.get("system") or {}), found)
    (history_dir() / f"{hid}.md").write_text(md_text, encoding="utf-8")
    if also_local and not in_app_bundle():
        local = HERE / "reports"
        local.mkdir(parents=True, exist_ok=True)
        (local / f"self-check-{hid}.md").write_text(md_text, encoding="utf-8")
    return dest


def history_index() -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for path in sorted(history_dir().glob("*.json"), reverse=True):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        overall_info = data.get("overall") or {}
        causes = data.get("causes") or []
        headline = ""
        if causes:
            first = causes[0]
            headline = f"{first.get('category', '')} — {first.get('title', '')}".strip(" —")
        items.append(
            {
                "id": data.get("id") or path.stem,
                "saved_at": data.get("saved_at"),
                "machine": data.get("machine"),
                "level": overall_info.get("level"),
                "level_cn": overall_info.get("level_cn") or LEVEL_CN.get(overall_info.get("level") or "", ""),
                "score": overall_info.get("score"),
                "summary": overall_info.get("summary"),
                "headline": headline,
            }
        )
    return items


def load_history(report_id: str) -> dict[str, Any] | None:
    path = history_dir() / f"{report_id}.json"
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def delete_history(report_id: str) -> bool:
    if not report_id or "/" in report_id or "\\" in report_id:
        return False
    removed = False
    for suffix in (".json", ".md"):
        path = history_dir() / f"{report_id}{suffix}"
        if path.is_file():
            path.unlink()
            removed = True
    return removed


def run_check(
    quick: bool = False,
    on_progress: Any | None = None,
    persist: bool = True,
    also_local: bool = False,
) -> dict[str, Any]:
    sysinfo, findings = collect_with_progress(quick=quick, on_progress=on_progress)
    report = build_report(sysinfo, findings)
    if persist:
        if on_progress:
            on_progress("save", "正在保存记录…")
        save_report(report, findings, also_local=also_local)
        report["history_dir"] = str(history_dir())
    return report


# ---------------------------------------------------------------------------
# 入口
# ---------------------------------------------------------------------------

def parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="电脑自检：诊断卡顿原因并给出优化建议")
    p.add_argument("--quick", action="store_true", help="跳过较慢的采样（iostat / ping / top 二次采样）")
    p.add_argument("--json", action="store_true", dest="as_json", help="在报告后打印 JSON")
    p.add_argument("--no-save", action="store_true", help="不写入 reports/ 目录")
    p.add_argument("--no-color", action="store_true", help="禁用 ANSI 颜色")
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    if args.no_color or not sys.stdout.isatty():
        C.disable()

    print(f"{C.dim}正在采集系统指标…{C.reset}", file=sys.stderr)

    def on_progress(step: str, message: str) -> None:
        print(f"{C.dim}[{step}] {message}{C.reset}", file=sys.stderr)

    report = run_check(
        quick=args.quick,
        on_progress=on_progress,
        persist=not args.no_save,
        also_local=not args.no_save,
    )
    findings = findings_from_dicts(list(report.get("findings") or []))
    sysinfo = dict(report.get("system") or {})
    saved = history_dir() / f"{report['id']}.md" if not args.no_save else None
    print(render_terminal(sysinfo, findings, saved))

    if args.as_json:
        print(json.dumps(report, ensure_ascii=False, indent=2, default=str))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\n已取消。", file=sys.stderr)
        raise SystemExit(130)
