#!/usr/bin/env python3
"""Generate a 1024×1024 PPM icon (teal pulse) for the Mac app."""

from __future__ import annotations

import math
import sys
from pathlib import Path


def main() -> int:
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "icon.ppm")
    w = 256
    bg = (15, 118, 110)
    pixels = bytearray(w * w * 3)

    def put(x: int, y: int, rgb: tuple[int, int, int], alpha: float = 1.0) -> None:
        if x < 0 or y < 0 or x >= w or y >= w or alpha <= 0:
            return
        i = (y * w + x) * 3
        if alpha >= 1:
            pixels[i : i + 3] = bytes(rgb)
            return
        pixels[i] = int(pixels[i] * (1 - alpha) + rgb[0] * alpha)
        pixels[i + 1] = int(pixels[i + 1] * (1 - alpha) + rgb[1] * alpha)
        pixels[i + 2] = int(pixels[i + 2] * (1 - alpha) + rgb[2] * alpha)

    for y in range(w):
        for x in range(w):
            # slight vertical gradient
            t = y / w
            rgb = (
                int(bg[0] + 18 * t),
                int(bg[1] + 8 * t),
                int(bg[2] - 6 * t),
            )
            put(x, y, rgb)

    cx, cy, r = w // 2, w // 2, int(w * 0.33)
    for y in range(cy - r, cy + r):
        for x in range(cx - r, cx + r):
            d = math.hypot(x - cx, y - cy)
            if d <= r:
                a = max(0.0, 1.0 - d / r) * 0.18
                put(x, y, (94, 234, 212), a)

    def stamp(x0: int, y0: int, x1: int, y1: int, width: int = 28) -> None:
        steps = max(abs(x1 - x0), abs(y1 - y0), 1)
        rad = max(4, width)
        for i in range(steps + 1):
            t = i / steps
            x = int(x0 + (x1 - x0) * t)
            y = int(y0 + (y1 - y0) * t)
            for dx in range(-rad, rad + 1):
                for dy in range(-rad, rad + 1):
                    if dx * dx + dy * dy <= rad * rad:
                        put(x + dx, y + dy, (255, 255, 255), 0.96)

    s = w / 1024
    pts = [
        (int(220 * s), int(530 * s)),
        (int(340 * s), int(530 * s)),
        (int(400 * s), int(530 * s)),
        (int(460 * s), int(300 * s)),
        (int(520 * s), int(730 * s)),
        (int(580 * s), int(470 * s)),
        (int(640 * s), int(530 * s)),
        (int(804 * s), int(530 * s)),
    ]
    for a, b in zip(pts, pts[1:]):
        stamp(*a, *b, width=max(5, int(26 * s)))

    out.write_bytes(b"P6\n%d %d\n255\n" % (w, w) + bytes(pixels))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
