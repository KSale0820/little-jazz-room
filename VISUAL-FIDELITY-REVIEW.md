# Visual fidelity review — individual assets integrated

**Authority:** `APPROVED-VISUAL-REFERENCE.png`, `FINAL-DESIGN-LOCK.md`, `web/docs/ASSET-INTEGRATION-PLAN.md`  
**Compared to:** `web/docs/screenshots/current-app/` (regenerate with `npm run screenshots`)  
**Claim:** **Closer to concept, not full parity.**

## Integrated this pass

- Hero room uses **`home-hero-{sunshine,twilight,night}.png`** (cat-free installed art) via `visualManifest.ts` + `RoomArt`.
- Home companion: single **SVG sprite** on floor; no portrait card frame; invisible hotspots with hover/focus hints only.
- **PageAtmosphere** headers (botanical decor) on Explore, Create, Practice, Profile.
- Profile **room banner** + sprite; chooser uses **`-portrait.png`** only (one source per cat).
- Practice defaults to **Chords** tab; blue chord tiles; chart in `practice-chart-stage`.
- Desktop shell widened (**1280px** grid, full-width content column).
- Cat metadata aligned with **`cats.json`** (coats, personality strings).
- Phase 3 sharing **not** started.

## Remaining mismatches vs approved reference

| Area | Gap |
|------|-----|
| Home room | Installed PNG is resized scene sheet, not full painterly mock resolution; window/plant detail softer than reference |
| Home cat | SVG sprites are plain vs concept illustration style; floor placement approximate |
| Botanical framing | Corner accents + small decor PNGs, not full vine frame around phone mock |
| Explore lists | Text-only rows (per design lock); reference shows thumbnails — intentional omission |
| Create form | Fewer fields than mock (no goal/difficulty/instrument chip row) — functional scope unchanged |
| Practice | No Scales tab content; no companion speech bubble; chart titles are seed studies not mock names |
| Profile | Chooser is 2×4 grid vs mock “companions” row; stats layout differs |
| Typography | Serif headings applied; exact mock scale/spacing not matched pixel-wise |
| Personalization | No “Good morning, Kat” display name |
| Quick access | Text buttons without pixel icons (lock allows either; reference shows icons on Start only) |

## Regenerate screenshots

```powershell
cd web
npm run dev
npm run screenshots
```

## Replace when available

- Native-resolution cat-free room PNGs per lighting mode
- Anatomy-checked full-body art (optional) while keeping `.svg` fallback
- Cleaner portrait crops without nameplate artifacts if present in source files
