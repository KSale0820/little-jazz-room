#!/usr/bin/env python3
"""Crop idle-column sprites from reference-only/revised-cat-board-1.png."""
from __future__ import annotations
import base64
import json
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
BOARD = ROOT / "reference-only" / "revised-cat-board-1.png"
OUT = ROOT / "jazz-cat-assets"
ROLES = json.loads((ROOT / "CAT-JAZZ-IDENTITIES.json").read_text(encoding="utf-8"))
ROSTER = json.loads((OUT / "cats.json").read_text(encoding="utf-8")) if (OUT / "cats.json").exists() else []

# Row order on the animation grid (top → bottom), matches board layout.
CAT_ORDER = ["luna", "milo", "maple", "mochi", "pepper", "patches", "chai", "biscuit"]

# Measured against 1536×1024 revised-cat-board-1.png — Idle column cells.
GRID = dict(
    x=168,
    y=548,
    cell_w=118,
    cell_h=52,
    rows=8,
)

BG_SAMPLES = [(250, 247, 239), (245, 242, 234), (255, 253, 248)]


def key_out(im: Image.Image, x: int, y: int) -> bool:
    if x < 0 or y < 0 or x >= im.width or y >= im.height:
        return False
    p = im.getpixel((x, y))[:3]
    for s in BG_SAMPLES:
        if abs(p[0] - s[0]) + abs(p[1] - s[1]) + abs(p[2] - s[2]) < 36:
            return True
    return p[0] > 238 and p[1] > 235 and p[2] > 225


def trim_and_pad(im: Image.Image, size: int = 256, pad: float = 0.08) -> Image.Image:
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


def rgba_key(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 10:
                continue
            if key_out(im, x, y):
                px[x, y] = (r, g, b, 0)
    return im


def anatomy_svg(cat_id: str, meta: dict, png_b64: str) -> str:
    label = f"{meta['name']}, {meta['age'].lower()}, {meta['build'].lower()} {meta['coat'].lower()} jazz cat"
    inst = next(r["instrument"] for r in ROLES if r["id"] == cat_id)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 256 256" width="256" height="256" role="img" aria-label="{label}">
<title>{meta["name"]} idle jazz companion</title>
<image x="0" y="0" width="256" height="256" xlink:href="data:image/png;base64,{png_b64}" preserveAspectRatio="xMidYMid meet"/>
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
<!-- role: {inst} · source: revised-cat-board-1 idle column -->
</svg>'''


def main() -> None:
    board = Image.open(BOARD).convert("RGBA")
    meta_by_id = {c["id"]: c for c in ROSTER} if ROSTER else {}

    for i, cat_id in enumerate(CAT_ORDER):
        x0 = GRID["x"]
        y0 = GRID["y"] + i * GRID["cell_h"]
        box = (x0, y0, x0 + GRID["cell_w"], y0 + GRID["cell_h"])
        cell = board.crop(box)
        cell = rgba_key(cell)
        sprite = trim_and_pad(cell, 256)
        png_path = OUT / f"{cat_id}.png"
        sprite.save(png_path, "PNG")

        buf = BytesIO()
        sprite.save(buf, format="PNG")
        b64 = base64.standard_b64encode(buf.getvalue()).decode("ascii")

        meta = meta_by_id.get(cat_id) or dict(
            name=cat_id.title(),
            coat="",
            age="Adult",
            build="Medium",
            personality="",
        )
        svg = anatomy_svg(cat_id, meta, b64)
        (OUT / f"{cat_id}.svg").write_text(svg, encoding="utf-8")
        print("Wrote", cat_id, box, "->", png_path.name)

    # Preview sheet for QA
    preview = Image.new("RGBA", (256 * 4, 256 * 2), (250, 247, 239, 255))
    for i, cat_id in enumerate(CAT_ORDER):
        im = Image.open(OUT / f"{cat_id}.png")
        preview.paste(im, ((i % 4) * 256, (i // 4) * 256), im)
    preview.save(ROOT / "jazz-cat-idle-extract-preview.png")
    print("Preview:", ROOT / "jazz-cat-idle-extract-preview.png")


if __name__ == "__main__":
    main()
