#!/usr/bin/env python3
"""Generate smooth illustrated idle cat SVGs (not blocky pixel grids)."""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "jazz-cat-assets"
ROLES = {r["id"]: r["instrument"] for r in json.loads((ROOT / "CAT-JAZZ-IDENTITIES.json").read_text(encoding="utf-8"))}
STROKE = "#4a3d36"

CATS = {
    "luna": dict(name="Luna", coat="Calico", personality="Curious & cozy", age="Adult", build="Medium", shape="medium",
                body="#f3e6cf", head="#fff3e0", ear="#c97842", patch1="#b86532", patch2="#5c4a44", eye="#3d5244", belly="#fff8ee"),
    "milo": dict(name="Milo", coat="Tuxedo", personality="Quiet & thoughtful", age="Adult", build="Slim", shape="slim",
                body="#2f3440", head="#2a2f3a", ear="#454956", patch1="#f7f2e8", patch2="#f7f2e8", eye="#8ec4e8", belly="#f0ebe3"),
    "maple": dict(name="Maple", coat="Ginger tabby", personality="Playful & energetic", age="Young adult", build="Lean", shape="young",
                 body="#e09545", head="#eba958", ear="#a86538", patch1="#9a5528", patch2="#9a5528", eye="#3a4538", belly="#ffd9a8"),
    "mochi": dict(name="Mochi", coat="Cream", personality="Gentle & sleepy", age="Kitten", build="Tiny", shape="kitten",
                 body="#f6ebe0", head="#faf0e6", ear="#e0b4b4", patch1="#dcc9bb", patch2="#dcc9bb", eye="#6b555c", belly="#fffaf5"),
    "pepper": dict(name="Pepper", coat="Dark charcoal gray", personality="Wise & mellow", age="Senior", build="Fluffy", shape="senior",
                  body="#3a3944", head="#45444f", ear="#6a656f", patch1="#5a5862", patch2="#5a5862", eye="#e8c98a", belly="#5c5a64"),
    "patches": dict(name="Patches", coat="Gray and white", personality="Friendly & goofy", age="Adult", build="Chubby", shape="chubby",
                    body="#8d989f", head="#eef2ea", ear="#8a9196", patch1="#6d787f", patch2="#6d787f", eye="#3f524f", belly="#f5f1e8"),
    "chai": dict(name="Chai", coat="Siamese", personality="Elegant & vocal", age="Adult", build="Slender", shape="long",
                 body="#dcc8aa", head="#ead9c0", ear="#5f4c42", patch1="#6b564c", patch2="#6b564c", eye="#6ea8d8", belly="#e8d5b8"),
    "biscuit": dict(name="Biscuit", coat="Brown tabby", personality="Adventurous & cozy", age="Adult", build="Large", shape="large",
                    body="#a8795c", head="#b98566", ear="#7a523f", patch1="#6f4b3a", patch2="#6f4b3a", eye="#36513a", belly="#e0b896"),
}

SHAPES = {
    "medium": dict(bw=38, hw=34, hy=22, bt=42, ear=14),
    "slim": dict(bw=30, hw=30, hy=20, bt=40, ear=15),
    "young": dict(bw=34, hw=32, hy=22, bt=42, ear=15),
    "kitten": dict(bw=28, hw=34, hy=28, bt=46, ear=14),
    "senior": dict(bw=46, hw=38, hy=20, bt=40, ear=12),
    "chubby": dict(bw=48, hw=36, hy=22, bt=42, ear=12),
    "long": dict(bw=30, hw=30, hy=20, bt=40, ear=16),
    "large": dict(bw=50, hw=38, hy=24, bt=44, ear=13),
}


def svg(cat_id: str, c: dict) -> str:
    s = SHAPES[c["shape"]]
    cx = 64
    bl, br = cx - s["bw"] / 2, cx + s["bw"] / 2
    hl, hr = cx - s["hw"] / 2, cx + s["hw"] / 2
    hy, bt = s["hy"], s["bt"]
    hb = hy + 24

    body = (
        f'<ellipse data-anatomy="body" cx="{cx}" cy="{bt + 14}" rx="{s["bw"]/2 - 2:.1f}" ry="{58 - bt:.1f}" '
        f'fill="url(#bodyGrad)" stroke="{STROKE}" stroke-width="1.6"/>'
    )
    belly = f'<ellipse cx="{cx}" cy="{bt + 20}" rx="{s["bw"]/2 - 10:.1f}" ry="10" fill="{c["belly"]}" opacity="0.55"/>'

    tail = (
        f'<path data-anatomy="tail" d="M {br - 6:.1f} 52 Q {br + 18:.1f} 46 {br + 14:.1f} 24 Q {br + 8:.1f} 14 {br - 2:.1f} 20" '
        f'fill="none" stroke="url(#tailGrad)" stroke-width="9" stroke-linecap="round"/>'
    )

    ears = (
        f'<path data-anatomy="ear" d="M {hl + 6:.1f} {hy + 6:.1f} L {hl + 12:.1f} {hy - s["ear"]:.1f} L {hl + 22:.1f} {hy + 8:.1f} Z" '
        f'fill="{c["ear"]}" stroke="{STROKE}" stroke-width="1.4" stroke-linejoin="round"/>'
        f'<path data-anatomy="ear" d="M {hr - 22:.1f} {hy + 8:.1f} L {hr - 12:.1f} {hy - s["ear"]:.1f} L {hr - 6:.1f} {hy + 6:.1f} Z" '
        f'fill="{c["ear"]}" stroke="{STROKE}" stroke-width="1.4" stroke-linejoin="round"/>'
        f'<path d="M {hl + 10:.1f} {hy + 2:.1f} L {hl + 13:.1f} {hy - s["ear"] + 6:.1f} L {hl + 18:.1f} {hy + 5:.1f} Z" fill="#efb4b0" opacity="0.9"/>'
        f'<path d="M {hr - 18:.1f} {hy + 5:.1f} L {hr - 13:.1f} {hy - s["ear"] + 6:.1f} L {hr - 10:.1f} {hy + 2:.1f} Z" fill="#efb4b0" opacity="0.9"/>'
    )

    head = (
        f'<ellipse data-anatomy="head" cx="{cx}" cy="{hy + 12}" rx="{s["hw"]/2:.1f}" ry="15" '
        f'fill="url(#headGrad)" stroke="{STROKE}" stroke-width="1.6"/>'
    )

    patches = ""
    if cat_id == "luna":
        patches = (
            f'<path d="M {hl + 2:.1f} {hy + 4:.1f} Q {hl + 14:.1f} {hy + 2:.1f} {hl + 16:.1f} {hy + 14:.1f} Q {hl + 8:.1f} {hy + 16:.1f} {hl + 2:.1f} {hy + 10:.1f} Z" fill="{c["patch1"]}"/>'
            f'<path d="M {hr - 16:.1f} {hy + 6:.1f} Q {hr - 4:.1f} {hy + 4:.1f} {hr - 2:.1f} {hy + 14:.1f} Q {hr - 10:.1f} {hy + 16:.1f} {hr - 16:.1f} {hy + 12:.1f} Z" fill="{c["patch2"]}"/>'
        )
    elif cat_id == "milo":
        patches = f'<ellipse cx="{cx}" cy="{hy + 16}" rx="11" ry="9" fill="{c["patch1"]}" opacity="0.92"/>'
    elif cat_id == "patches":
        patches = (
            f'<path d="M {hl + 1:.1f} {hy + 5:.1f} L {hl + 14:.1f} {hy + 3:.1f} L {hl + 12:.1f} {hy + 14:.1f} Z" fill="{c["patch1"]}"/>'
            f'<ellipse cx="{hr - 8:.1f}" cy="{hy + 8:.1f}" rx="5" ry="4" fill="{c["patch1"]}"/>'
        )
    elif cat_id == "chai":
        patches = f'<ellipse cx="{cx}" cy="{hy + 17}" rx="13" ry="11" fill="{c["patch1"]}"/>'
    elif cat_id in ("maple", "biscuit"):
        patches = (
            f'<path stroke="{c["patch1"]}" stroke-width="2.2" stroke-linecap="round" fill="none" '
            f'd="M {hl + 8:.1f} {hy + 4:.1f} v6 M {cx - 2:.1f} {hy + 3:.1f} v5 M {hr - 10:.1f} {hy + 4:.1f} v6"/>'
        )
    elif cat_id == "pepper":
        patches = (
            f'<path d="M {hl + 4:.1f} {hy + 18:.1f} Q {cx:.1f} {hy + 22:.1f} {hr - 4:.1f} {hy + 18:.1f} L {hr - 6:.1f} {hb:.1f} Q {cx:.1f} {hb + 4:.1f} {hl + 6:.1f} {hb:.1f} Z" fill="{c["patch1"]}" opacity="0.35"/>'
        )

    eye_y = hy + 11
    eyes = (
        f'<ellipse data-face="eye" cx="{cx - 7:.1f}" cy="{eye_y:.1f}" rx="3.2" ry="4.2" fill="{c["eye"]}"/>'
        f'<ellipse data-face="eye" cx="{cx + 7:.1f}" cy="{eye_y:.1f}" rx="3.2" ry="4.2" fill="{c["eye"]}"/>'
        f'<circle cx="{cx - 6:.1f}" cy="{eye_y - 1:.1f}" r="1.1" fill="#fff" opacity="0.85"/>'
        f'<circle cx="{cx + 8:.1f}" cy="{eye_y - 1:.1f}" r="1.1" fill="#fff" opacity="0.85"/>'
    )
    if cat_id == "mochi":
        eyes = (
            f'<ellipse data-face="eye" cx="{cx - 7:.1f}" cy="{eye_y:.1f}" rx="3.8" ry="4.8" fill="{c["eye"]}"/>'
            f'<ellipse data-face="eye" cx="{cx + 7:.1f}" cy="{eye_y:.1f}" rx="3.8" ry="4.8" fill="{c["eye"]}"/>'
            f'<circle cx="{cx - 5.5:.1f}" cy="{eye_y - 1.5:.1f}" r="1.3" fill="#fff"/>'
            f'<circle cx="{cx + 8.5:.1f}" cy="{eye_y - 1.5:.1f}" r="1.3" fill="#fff"/>'
        )

    nose = f'<path d="M {cx - 2:.1f} {hy + 18:.1f} Q {cx:.1f} {hy + 21:.1f} {cx + 2:.1f} {hy + 18:.1f} Q {cx:.1f} {hy + 20:.1f} {cx - 2:.1f} {hy + 18:.1f}" fill="#c97b76"/>'
    mouth = (
        f'<path d="M {cx:.1f} {hy + 20:.1f} v2.5 M {cx:.1f} {hy + 22:.1f} q-3 2 -4 0 M {cx:.1f} {hy + 22:.1f} q3 2 4 0" '
        f'fill="none" stroke="{STROKE}" stroke-width="1.1" stroke-linecap="round"/>'
    )
    whiskers = (
        f'<path d="M {hl + 4:.1f} {hy + 17:.1f} H {hl + 14:.1f} M {hl + 5:.1f} {hy + 20:.1f} H {hl + 13:.1f} '
        f'M {hr - 14:.1f} {hy + 17:.1f} H {hr - 4:.1f} M {hr - 13:.1f} {hy + 20:.1f} H {hr - 5:.1f}" '
        f'stroke="{STROKE}" stroke-width="0.8" opacity="0.55"/>'
    )

    paw_y = 56 if c["shape"] != "kitten" else 58
    pw = 7 if c["shape"] in ("senior", "chubby", "large") else 6
    paws = "".join(
        f'<ellipse data-anatomy="paw" cx="{x:.1f}" cy="{paw_y:.1f}" rx="{pw/2:.1f}" ry="4.5" fill="{fill}" stroke="{STROKE}" stroke-width="1.2"/>'
        for x, fill in [(bl + 8, c["body"]), (br - 8, c["body"]), (cx - 7, c["belly"]), (cx + 7, c["belly"])]
    )

    accessories = ""
    if cat_id == "milo":
        accessories = (
            f'<rect x="{cx - 12:.1f}" y="{eye_y - 2:.1f}" width="24" height="5.5" rx="2.5" fill="#1a1a22" opacity="0.88"/>'
            f'<rect x="{cx - 11:.1f}" y="{eye_y - 1:.1f}" width="9" height="3.5" rx="1.2" fill="#2a3540" opacity="0.5"/>'
            f'<rect x="{cx + 2:.1f}" y="{eye_y - 1:.1f}" width="9" height="3.5" rx="1.2" fill="#2a3540" opacity="0.5"/>'
        )
    elif cat_id == "pepper":
        accessories = (
            f'<path d="M {cx - 12:.1f} {hb + 2:.1f} Q {cx:.1f} {hb + 8:.1f} {cx + 12:.1f} {hb + 2:.1f} L {cx + 10:.1f} {hb + 5:.1f} Q {cx:.1f} {hb + 10:.1f} {cx - 10:.1f} {hb + 5:.1f} Z" fill="#7b2433" stroke="{STROKE}" stroke-width="0.8"/>'
        )
    elif cat_id == "biscuit":
        accessories = (
            f'<path d="M {hl + 4:.1f} {hy - 2:.1f} Q {cx:.1f} {hy - 10:.1f} {hr - 4:.1f} {hy - 2:.1f}" fill="none" stroke="#4a4038" stroke-width="3.2" stroke-linecap="round"/>'
            f'<ellipse cx="{hl + 4:.1f}" cy="{hy:.1f}" rx="5" ry="4" fill="#3d3835" stroke="{STROKE}" stroke-width="1"/>'
            f'<ellipse cx="{hr - 4:.1f}" cy="{hy:.1f}" rx="5" ry="4" fill="#3d3835" stroke="{STROKE}" stroke-width="1"/>'
        )
    elif cat_id == "maple":
        accessories = f'<path d="M {cx - 10:.1f} {hb + 1:.1f} Q {cx:.1f} {hb + 6:.1f} {cx + 10:.1f} {hb + 1:.1f}" fill="none" stroke="#6eab99" stroke-width="2.5" stroke-linecap="round"/>'

    label = f"{c['name']}, {c['age'].lower()}, {c['build'].lower()} {c['coat'].lower()} jazz cat"
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="256" height="256" role="img" aria-label="{label}">
<title>{c["name"]} the jazz cat</title>
<defs>
  <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="{c["body"]}"/><stop offset="100%" stop-color="{c["head"]}"/></linearGradient>
  <linearGradient id="headGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="{c["head"]}"/><stop offset="100%" stop-color="{c["body"]}"/></linearGradient>
  <linearGradient id="tailGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="{c["body"]}"/><stop offset="100%" stop-color="{c["ear"]}"/></linearGradient>
</defs>
<g id="tail">{tail}</g>
<g id="body">{body}{belly}</g>
<g id="paws">{paws}</g>
<g id="ears">{ears}</g>
<g id="head">{head}{patches}</g>
<g id="face">{eyes}{nose}{mouth}{whiskers}{accessories}</g>
</svg>'''


def main() -> None:
    OUT.mkdir(exist_ok=True)
    roster = []
    for cat_id, meta in CATS.items():
        content = svg(cat_id, meta)
        (OUT / f"{cat_id}.svg").write_text(content, encoding="utf-8")
        roster.append(
            dict(
                id=cat_id,
                name=meta["name"],
                coat=meta["coat"],
                character=meta["personality"],
                age=meta["age"],
                build=meta["build"],
                shape=meta["shape"],
                instrument=ROLES[cat_id],
            )
        )
    (OUT / "cats.json").write_text(json.dumps(roster, indent=2) + "\n", encoding="utf-8")
    print("Wrote illustrated SVGs for:", ", ".join(CATS))


if __name__ == "__main__":
    main()
