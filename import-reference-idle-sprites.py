#!/usr/bin/env python3
"""Import reference-aligned idle JPGs into jazz-cat-assets PNG+SVG."""
from __future__ import annotations
import base64
import json
from collections import deque
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
OUT = ROOT / "jazz-cat-assets"
CAT_ORDER = ["luna", "milo", "maple", "mochi", "pepper", "patches", "chai", "biscuit"]


def flood_transparent(im: Image.Image, tolerance: int = 34) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    visited = [[False] * w for _ in range(h)]

    def bg(r: int, g: int, b: int) -> bool:
        return r > 230 and g > 228 and b > 220

    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or visited[y][x]:
            continue
        visited[y][x] = True
        r, g, b, a = px[x, y]
        if not bg(r, g, b):
            continue
        px[x, y] = (r, g, b, 0)
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    return im


def trim_pad(im: Image.Image, size: int = 256, pad: float = 0.06) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cropped = im.crop(bbox)
    w, h = cropped.size
    scale = (size * (1 - 2 * pad)) / max(w, h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(resized, ((size - nw) // 2, (size - nh) // 2), resized)
    return canvas


def svg_wrap(cat_id: str, meta: dict, b64: str) -> str:
    label = (
        f"{meta['name']}, {meta['age'].lower()}, {meta['build'].lower()} "
        f"{meta['coat'].lower()} jazz cat"
    )
    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 256 256" width="256" height="256" role="img" aria-label="{label}">
<title>{meta["name"]} idle jazz companion</title>
<image x="0" y="0" width="256" height="256" xlink:href="data:image/png;base64,{b64}" preserveAspectRatio="xMidYMid meet"/>
<g id="structure" opacity="0" aria-hidden="true">
  <ellipse data-anatomy="head" cx="128" cy="92" rx="38" ry="34"/>
  <path data-anatomy="ear" d="M96 72 L88 38 L112 64 Z"/>
  <path data-anatomy="ear" d="M160 64 L184 38 L176 72 Z"/>
  <ellipse data-anatomy="body" cx="128" cy="158" rx="52" ry="58"/>
  <path data-anatomy="tail" d="M178 170 Q210 150 200 110"/>
  <ellipse data-anatomy="paw" cx="98" cy="208" rx="14" ry="10"/>
  <ellipse data-anatomy="paw" cx="118" cy="214" rx="14" ry="10"/>
  <ellipse data-anatomy="paw" cx="138" cy="214" rx="14" ry="10"/>
  <ellipse data-anatomy="paw" cx="158" cy="208" rx="14" ry="10"/>
  <ellipse data-face="eye" cx="112" cy="88" rx="6" ry="8"/>
  <ellipse data-face="eye" cx="144" cy="88" rx="6" ry="8"/>
</g>
<!-- source: reference-aligned idle art pass · role: {meta.get("instrument", "")} -->
</svg>'''


def main() -> None:
    roster = json.loads((OUT / "cats.json").read_text(encoding="utf-8"))
    meta_by_id = {c["id"]: c for c in roster}
    preview = Image.new("RGBA", (256 * 4, 256 * 2), (250, 247, 239, 255))

    for i, cat_id in enumerate(CAT_ORDER):
        src = ASSETS / f"{cat_id}-idle-ref.jpg"
        if not src.exists():
            raise SystemExit(f"Missing source art: {src}")
        im = flood_transparent(Image.open(src))
        sprite = trim_pad(im)
        png_path = OUT / f"{cat_id}.png"
        sprite.save(png_path, "PNG")
        buf = BytesIO()
        sprite.save(buf, format="PNG")
        b64 = base64.standard_b64encode(buf.getvalue()).decode("ascii")
        meta = meta_by_id[cat_id]
        (OUT / f"{cat_id}.svg").write_text(svg_wrap(cat_id, meta, b64), encoding="utf-8")
        preview.paste(sprite, ((i % 4) * 256, (i // 4) * 256), sprite)
        print("Imported", cat_id)

    preview.save(ROOT / "jazz-cat-idle-extract-preview.png")
    print("Preview:", ROOT / "jazz-cat-idle-extract-preview.png")


if __name__ == "__main__":
    main()
