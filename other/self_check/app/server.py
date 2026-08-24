#!/usr/bin/env python3
"""电脑自检桌面应用的本地 HTTP 服务（仅 127.0.0.1）。"""

from __future__ import annotations

import argparse
import json
import os
import socket
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
WEB_ROOT = ROOT / "web"
CHECK_ROOT = ROOT if (ROOT / "check.py").is_file() else ROOT.parent
if str(CHECK_ROOT) not in sys.path:
    sys.path.insert(0, str(CHECK_ROOT))

import check  # noqa: E402

MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".json": "application/json; charset=utf-8",
    ".ico": "image/x-icon",
}


class Handler(BaseHTTPRequestHandler):
    server_version = "SelfCheck/2.0"

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _send(self, code: int, body: bytes, content_type: str, extra: dict[str, str] | None = None) -> None:
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        if extra:
            for k, v in extra.items():
                self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _json(self, code: int, payload: object) -> None:
        raw = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
        self._send(code, raw, "application/json; charset=utf-8")

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        try:
            data = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            return {}
        return data if isinstance(data, dict) else {}

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if path in ("/", "/index.html"):
            return self._serve_file(WEB_ROOT / "index.html")
        if path.startswith("/api/history/") and path != "/api/history/":
            report_id = path.rsplit("/", 1)[-1]
            report = check.load_history(report_id)
            if report is None:
                return self._json(404, {"error": "记录不存在"})
            return self._json(200, report)
        if path == "/api/history":
            return self._json(200, {"items": check.history_index(), "dir": str(check.history_dir())})
        if path == "/api/meta":
            return self._json(
                200,
                {
                    "version": check.VERSION,
                    "history_dir": str(check.history_dir()),
                },
            )
        if path.startswith("/"):
            rel = path.lstrip("/")
            candidate = (WEB_ROOT / rel).resolve()
            try:
                candidate.relative_to(WEB_ROOT.resolve())
            except ValueError:
                return self._json(403, {"error": "forbidden"})
            if candidate.is_file():
                return self._serve_file(candidate)
        self._json(404, {"error": "not found"})

    def do_DELETE(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if path.startswith("/api/history/"):
            report_id = path.rsplit("/", 1)[-1]
            ok = check.delete_history(report_id)
            return self._json(200 if ok else 404, {"ok": ok})
        self._json(404, {"error": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path != "/api/run":
            return self._json(404, {"error": "not found"})
        body = self._read_json()
        quick = bool(body.get("quick"))

        self.send_response(200)
        self.send_header("Content-Type", "application/x-ndjson; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Accel-Buffering", "no")
        self.end_headers()

        def emit(obj: dict) -> None:
            line = json.dumps(obj, ensure_ascii=False, default=str) + "\n"
            self.wfile.write(line.encode("utf-8"))
            self.wfile.flush()

        def on_progress(step: str, message: str) -> None:
            emit({"type": "progress", "step": step, "message": message})

        try:
            report = check.run_check(quick=quick, on_progress=on_progress, persist=True, also_local=False)
            emit({"type": "done", "report": report})
        except Exception as exc:  # noqa: BLE001
            emit({"type": "error", "message": str(exc)})

    def _serve_file(self, path: Path) -> None:
        if not path.is_file():
            return self._json(404, {"error": "not found"})
        data = path.read_bytes()
        ctype = MIME.get(path.suffix.lower(), "application/octet-stream")
        self._send(200, data, ctype)

    def handle_one_request(self) -> None:
        try:
            super().handle_one_request()
        except BrokenPipeError:
            pass
        except ConnectionResetError:
            pass


def pick_port(preferred: int) -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind(("127.0.0.1", preferred))
            return preferred
        except OSError:
            sock.bind(("127.0.0.1", 0))
            return int(sock.getsockname()[1])


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="电脑自检桌面服务")
    parser.add_argument("--port", type=int, default=17831)
    parser.add_argument("--open", action="store_true", help="用浏览器打开（开发时使用）")
    args = parser.parse_args(argv)
    port = pick_port(args.port)
    httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    url = f"http://127.0.0.1:{port}/"
    print(f"READY {url}", flush=True)
    if args.open:
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever(poll_interval=0.3)
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
    return 0


if __name__ == "__main__":
    os.environ.setdefault("SELFCHECK_APP", "1")
    raise SystemExit(main())
