# Reference-aligned idle cat sprites

Production companions in `jazz-cat-assets/` were rebuilt to match **Concept G / Modern Jazz Companions** (`APPROVED-VISUAL-REFERENCE.png`).

## Source

1. Eight idle portraits generated with `APPROVED-VISUAL-REFERENCE.png` as visual reference (stored in `assets/*-idle-ref.jpg`).
2. `import-reference-idle-sprites.py` removes the white backdrop, trims/pads to **256×256 PNG**, and writes SVG wrappers (embedded PNG + structural anatomy tags for `verify-static-cat-structure.py`).

## Re-run after art tweaks

```bash
# Replace JPGs in assets/, then:
python import-reference-idle-sprites.py
python verify-static-cat-structure.py
Copy-Item jazz-cat-assets\*.svg, jazz-cat-assets\*.png web\public\jazz-cat-assets\
```

Preview sheet: `jazz-cat-idle-extract-preview.png`

## Manual QA (required before Phase 1 sign-off)

Per `FINAL-DESIGN-LOCK.md`, check each cat at **48 / 96 / 256 px**: one head, two eyes, four paws, one tail; Milo sunglasses, Pepper burgundy neckerchief, Biscuit headphones; **no instruments** on idle chooser sprites.
