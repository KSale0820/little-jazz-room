#!/usr/bin/env python3
"""Install the exact approved Tracks-and-Charts PNGs from the source asset ZIP.

Run at any location with:
python3 web/scripts/install-approved-tracks-assets.py /path/to/Little-Jazz-Room-Tracks-Approved-Assets.zip

No packages required. It verifies SHA-256 checksums and updates only Tracks
asset references. Run from a checkout of PR #86, then commit/push the changes.
"""
from __future__ import annotations

import hashlib
from pathlib import Path
import sys
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[2]
FILES = {
    "tracks-title.png": (
        "web/public/visuals/tracks-approved/tracks-title.png",
        "e77dd6d9de718489c55f0317bce0686b85ad80e1310d8b7e185e59f6af7f4898",
    ),
    "jazz-study-shelf.png": (
        "web/public/visuals/tracks-approved/jazz-study-shelf.png",
        "842c980fbf81ba618d24fc2aa977dd13a4f9e15403a8db4938ba6d4b16929d0f",
    ),
    "TRACKS-AND-CHARTS-APPROVED-UI.png": (
        "web/docs/approved-ui/TRACKS-AND-CHARTS-APPROVED-UI.png",
        "568f41ad378b31dcfe11924fdcfcd2a13c28030e00a9fdbe7732739873f75977",
    ),
    "bookmark-filled.png": (
        "web/docs/approved-ui/bookmark-filled-source.png",
        "e1250d4de50eda6d30809785023e1be1204f0668f65d167e8dae29fbe4676c3a",
    ),
    "bookmarked-card-reference.png": (
        "web/docs/approved-ui/bookmarked-card-reference.png",
        "966e4bb7d13305684e558abcbcf176abec8d5120213cbc964d57951ede3578df",
    ),
}

def replace_once(path: Path, old: str, new: str) -> None:
    data = path.read_text(encoding="utf-8")
    if new in data:
        return
    if old not in data:
        raise ValueError(f"Expected text not found in {path}: {old}")
    path.write_text(data.replace(old, new, 1), encoding="utf-8")

def main(zip_path: str) -> None:
    src = Path(zip_path).expanduser().resolve()
    with ZipFile(src) as z:
        names = {n.rsplit("/", 1)[-1]: n for n in z.namelist()}
        # Validate *all* files before changing the working tree.
        verified: dict[str, bytes] = {}
        for name, (_dest, expected) in FILES.items():
            b = z.read(names[name])
            digest = hashlib.sha256(b).hexdigest()
            if digest != expected:
                raise ValueError(f"Wrong bytes for {name}: {digest}")
            verified[name] = b
    for name, (dest, _hash) in FILES.items():
        target = ROOT / dest
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(verified[name])
        print(f"Exact PNG: {dest}")

    page = ROOT / "web/src/pages/TracksPage.tsx"
    manifest = ROOT / "web/src/assets/visualManifest.ts"
    replace_once(page, 'src="/visuals/tracks-approved/tracks-title.svg"', 'src="/visuals/tracks-approved/tracks-title.png"')
    replace_once(page, 'src="/visuals/tracks-approved/jazz-study-shelf.svg"', 'src="/visuals/tracks-approved/jazz-study-shelf.png"')
    replace_once(manifest, "title: '/visuals/tracks-approved/tracks-title.svg'", "title: '/visuals/tracks-approved/tracks-title.png'")
    replace_once(manifest, "studyShelf: '/visuals/tracks-approved/jazz-study-shelf.svg'", "studyShelf: '/visuals/tracks-approved/jazz-study-shelf.png'")
    needle = "    record: '/visuals/tracks-approved/record.png',"
    addition = needle + "\n    bookmarkFilledSource: '/docs/approved-ui/bookmark-filled-source.png',"
    # The source bookmark is a design reference, not a runtime asset; no manifest entry needed.

    print("Updated TracksPage and visualManifest; exact PNG bytes verified.")
    print("Run: cd web && npm run build && npm test")
    print("Then git add web/public/visuals/tracks-approved web/docs/approved-ui web/src/pages/TracksPage.tsx web/src/assets/visualManifest.ts")
    print("Commit and push the PR #86 branch. Do not overwrite these exact PNGs with regenerated art.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python3 web/scripts/install-approved-tracks-assets.py <approved-assets.zip>")
    main(sys.argv[1])
