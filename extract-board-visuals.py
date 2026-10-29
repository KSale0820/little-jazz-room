#!/usr/bin/env python3
"""Extract board-faithful room backgrounds and cat card art from revised-cat-board-1.png."""
from __future__ import annotations
import base64
import json
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent
BOARD = ROOT / "reference-only" / "revised-cat-board-1.png"
WEB = ROOT / "web" / "public"
CATS = ["luna", "milo", "maple", "mochi", "pepper", "patches", "chai", "biscuit"]

# One profile card per column (1536×1024 board).
CARD_W, CARD_H, CARD_Y0 = 172, 238, 116
CARD_X = [28, 204, 380, 556]


def card_box(index: int) -> tuple[int, int, int, int]:
    row = index // 4
    col = index % 4
    y0 = CARD_Y0 + row * (CARD_H + 14)
    y1 = y0 + CARD_H
    x0 = CARD_X[col]
    return (x0, y0, x0 + CARD_W, y1)


def main() -> None:
    im = Image.open(BOARD).convert("RGBA")
    cards_dir = WEB / "jazz-cat-assets" / "cards"
    assets_dir = WEB / "jazz-cat-assets"
    room_dir = WEB / "room"
    cards_dir.mkdir(parents=True, exist_ok=True)
    room_dir.mkdir(parents=True, exist_ok=True)

    roster = json.loads((ROOT / "jazz-cat-assets" / "cats.json").read_text(encoding="utf-8"))
    meta = {c["id"]: c for c in roster}

    for i, cat_id in enumerate(CATS):
        card = im.crop(card_box(i))
        card.save(cards_dir / f"{cat_id}-card.png")
        # Illustration + instrument (top ~62% — drops bio + Adult/Size footer).
        cw, ch = card.size
        art = card.crop((0, 0, cw, int(ch * 0.42)))
        art = art.resize((280, 280), Image.Resampling.LANCZOS)
        art.save(assets_dir / f"{cat_id}-portrait.png")

        buf = BytesIO()
        art.save(buf, format="PNG")
        b64 = base64.standard_b64encode(buf.getvalue()).decode("ascii")
        m = meta[cat_id]
        label = f"{m['name']}, {m.get('instrument', '')} jazz cat"
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 280 280" width="280" height="280" role="img" aria-label="{label}">
<image width="280" height="280" xlink:href="data:image/png;base64,{b64}"/>
<g opacity="0" aria-hidden="true">
<ellipse data-anatomy="head" cx="140" cy="95" rx="36" ry="32"/>
<path data-anatomy="ear" d="M108 78 L100 48 L124 70 Z"/>
<path data-anatomy="ear" d="M156 70 L180 48 L172 78 Z"/>
<ellipse data-anatomy="body" cx="140" cy="165" rx="48" ry="52"/>
<path data-anatomy="tail" d="M188 175 Q220 155 210 115"/>
<ellipse data-anatomy="paw" cx="108" cy="215" rx="12" ry="9"/>
<ellipse data-anatomy="paw" cx="128" cy="220" rx="12" ry="9"/>
<ellipse data-anatomy="paw" cx="152" cy="220" rx="12" ry="9"/>
<ellipse data-anatomy="paw" cx="172" cy="215" rx="12" ry="9"/>
<ellipse data-face="eye" cx="124" cy="92" rx="6" ry="7"/>
<ellipse data-face="eye" cx="156" cy="92" rx="6" ry="7"/>
</g></svg>'''
        (ROOT / "jazz-cat-assets" / f"{cat_id}.svg").write_text(svg, encoding="utf-8")
        (assets_dir / f"{cat_id}.svg").write_text(svg, encoding="utf-8")
        art.save(ROOT / "jazz-cat-assets" / f"{cat_id}.png")

    # Home room illustration inside the board's Home phone mock (no dashboard chrome).
    base = im.convert("RGB").crop((68, 696, 294, 768))
    base.save(room_dir / "home-room-base.png")
    tw = ImageEnhance.Color(base).enhance(0.72)
    tw = ImageEnhance.Brightness(tw).enhance(0.84)
    tw.save(room_dir / "home-room-twilight.png")
    nt = ImageEnhance.Color(base).enhance(0.42)
    nt = ImageEnhance.Brightness(nt).enhance(0.52)
    nt.save(room_dir / "home-room-night.png")
    print("Extracted room + 8 board cards")


if __name__ == "__main__":
    main()
