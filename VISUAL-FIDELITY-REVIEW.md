# Visual fidelity review — post reconstruction pass

**Authority:** `APPROVED-VISUAL-REFERENCE.png`, `FINAL-DESIGN-LOCK.md`  
**Compared to:** fresh captures in `web/docs/screenshots/current-app/` (regenerate with `npm run screenshots`)  
**Claim:** **Not visual parity.** This documents remaining gaps after a layout/asset-structure pass.

## Fixes applied (this pass)

- Home no longer uses `home-room-base.png` as primary (giant cat crop); cat-free SVG room + single **sprite** companion overlay.
- Removed visible hotspot **pills**; transparent hit targets with hover/focus hint labels only.
- Removed second cat thumbnail from Home long-term goal card.
- Replaced streak emoji with a small CSS mark.
- Central **`visualManifest.ts`** with filename contract and load fallbacks (`RoomArt`, `CatSprite`).
- Cream / sage / evergreen tokens, serif headings, botanical corner accents on room hero.
- Phase 3 sharing and deployment **not** started.

## Screen-by-screen — remaining mismatches vs reference

### Home

| Reference | Current build |
|-----------|----------------|
| Large painterly room with window, plants, instruments, one cat on cushion | Placeholder **vector** room; readable layout but not illustration fidelity |
| Botanical vine **frame** around full mock | Small corner SVG accents only |
| “Good morning, Kat” personalization | Time-based greeting only (no display name) |
| Stats row with illustrated note icon | Text ♪ and CSS streak dot |
| Quick access with **pixel** nav icons on buttons | Text-only quick buttons (matches design lock for this row) |

### Explore

| Reference | Current build |
|-----------|----------------|
| Routine rows with **cat thumbnails** | Text-only rows (correct per design lock: no icons in exercise rows) |
| Tighter mock spacing / card thumbnails | Functional list; less visual richness |
| Three tabs including Challenges preview | Present as preview copy |

### Create

| Reference | Current build |
|-----------|----------------|
| Goal + difficulty + instrument chips in mock | Title, visibility, step list; fewer segmented controls |
| Cleaner form density | Adequate spacing; not matched to mock typography scale |

### Practice

| Reference | Current build |
|-----------|----------------|
| Compact blue chord tiles on ivory sheet | Ivory grid present; tile color more neutral green-gray |
| Optional Scales tab with content | Scales tab not shown (content-gated in lock) |
| Small cat in **separate** bottom panel with speech bubble | Cat in dashed companion panel; no bubble copy |
| Reference chart title styling | Uses seed chart titles (original studies, not mock names) |

### Profile

| Reference | Current build |
|-----------|----------------|
| Room illustration behind profile header | No room hero on Profile |
| “My Companions” circular row | Full eight-cat chooser grid (functional, denser than mock) |
| Weekly stats layout from mock | Stats + calendar present; visual weight differs |

### Global / assets

| Issue | Notes |
|-------|--------|
| `-portrait.png` files | Some appear **card crops** with name plates; replace via manifest when final portraits arrive |
| Legacy `/room/home-room-*.png` | Still in repo; **deprecated**, not primary |
| Cat-free **production** room art | SVG placeholders until owner supplies final PNG/JPG set |
| Desktop sidebar | Functional; reference is phone-first collage |
| Pixel bottom nav | Present; reference pixel icon style partially matched |

## Regenerate comparison screenshots

```powershell
cd web
npm run dev
npm run screenshots
```

## Next visual work (non-functional)

1. Replace `catfree-*.svg` with approved cat-free room illustrations (three lighting modes).
2. Replace portrait PNGs with anatomy-checked assets (no composite crops).
3. Profile optional room banner (cat-free + single companion).
4. Practice chord tile color/spacing pass toward reference blues on ivory.
5. Owner sign-off against new screenshots before claiming parity.
