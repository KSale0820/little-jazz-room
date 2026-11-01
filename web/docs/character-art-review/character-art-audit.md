# Character Artwork Consistency Audit

**Repository:** KSale0820/little-jazz-room  
**Branch:** `feature/character-art-standardization`  
**Phase:** Inventory + visual comparison only — **no production artwork changed, deleted, or replaced**  
**Stop point:** Visual approval required before any art selection or asset cleanup

Reference aesthetic: `APPROVED-VISUAL-REFERENCE.png` (Concept G — Modern Jazz Companions) + cozy botanical illustrated room art.

---

## 1. Inventory

### 1.1 Runtime asset root

`web/public/jazz-cat-assets/` is what the app loads.

| Variant | Path pattern | Size | Mode | Transparent | Used by app? |
|---|---|---|---|---|---|
| Full-body idle | `{id}.png` | 256×256 | RGBA | Yes (~24–48% opaque) | **Yes** — Home, Profile selected, Profile chooser |
| Portrait | `{id}-portrait.png` | 512×512 | RGBA | Yes | **Yes** — Practice `CatSprite` default (`variant="portrait"`) |
| Icon | `{id}-icon.png` | 256×256 | RGBA | Yes | **No** — exact downscale of portrait |
| Small | `{id}-small.png` | 128×128 | RGBA | Yes | **No** — portrait family downscale |
| Card | `cards/{id}-card.png` | 172×238 | RGBA | Opaque (100%) | **No** |
| SVG sprite | `{id}.svg` | viewBox 64×64, ~2.3–2.6 KB | crispEdges pixel paths | N/A | **Fallback only** if PNG fails |
| Manifest | `cats.json` | — | — | — | Tests / pipeline metadata (portrait + sprite URLs; no floor field) |

All eight IDs present: `luna`, `milo`, `maple`, `mochi`, `pepper`, `patches`, `chai`, `biscuit`.

### 1.2 Non-runtime / legacy

| Location | Contents | Notes |
|---|---|---|
| `/jazz-cat-assets/` (repo root) | 280×280 PNGs + large SVG wrappers embedding PNG base64 | **Not** what `visualManifest.ts` serves. Different generation path (`extract-board-visuals.py` / older pipeline). |
| `jazz-cat-idle-extract-preview.png` | Contact of eight idle full-bodies | Matches current public `{id}.png` family |
| `APPROVED-VISUAL-REFERENCE.png` | Concept board with instruments + UI mockups | Identity + aesthetic north star; instruments are **role specs**, not required on idle sprites (`REFERENCE-IDLE-ART.md`, `CAT-COMPANIONS.md`) |
| `assets/*-idle-ref.jpg` (if present) | Source JPGs for idle import | Pipeline input for full-body PNGs |

### 1.3 Code usage map

| Surface | Component | Asset | Display size |
|---|---|---|---|
| Home room floor | `CatSprite variant="floor"` | `/jazz-cat-assets/{id}.png` → SVG fallback | `size={220}` |
| Profile selected companion | `CatSprite variant="floor"` | same full-body PNG | `size={140}` |
| Profile chooser | `CatChooserArt` → `catFloorUrls` | same full-body PNG | CSS square, `object-fit: contain` |
| Practice (Player tab, not Focus) | `CatSprite` default `variant="portrait"` | `/jazz-cat-assets/{id}-portrait.png` → SVG fallback | `size={48}` |

Central URLs: `web/src/assets/visualManifest.ts`.

---

## 2. Visual comparison artifacts

| File | Purpose |
|---|---|
| `cat-art-contact-sheet.png` | All eight cats × full / portrait / icon / small / card, filenames + dimensions labeled |
| `eight-cat-comparison.png` | Eight cats at comparable sizes: full-body, portrait, SVG raster |
| `pepper-patches-mochi-focus.png` | Pepper vs Patches + Mochi scale vs Luna / Biscuit / Chai |
| `svg-fallback-sprites.png` | Pixel SVG family alone |
| `svg-rasters/{id}-svg.png` | Per-cat SVG screenshots |
| `jazz-cat-idle-extract-preview.png` | Prior idle lineup (full-body family) |
| `approved-visual-reference-included.png` | Scaled copy of approved concept board |
| `screenshots/mobile|desktop/*` | Playwright captures at **390×844** and **1280×900** |

---

## 3. Style families (three distinct looks)

1. **Full-body illustrated idle (`{id}.png`)** — Cozy digital illustration, soft shading, transparent, seated facing camera, **no instruments**. Matches the botanical / illustrated product direction and the idle extract preview. **Best production family for presence on Home/Profile.**
2. **Portrait / icon / small (`{id}-portrait.png` family)** — Tight “peek over bottom edge” head crops. Same general illustration language, but **accessories and props often disagree** with full-body (see §4). Practice currently uses this at 48px.
3. **SVG crispEdges sprites (`{id}.svg`)** — Tiny pixel-art cats (64×64 logic). **Does not match** the approved cozy illustrated aesthetic. Only a load fallback today.

**Card PNGs** are a fourth, broken family (opaque board crops / wrong frames) — see §6.

---

## 4. Per-character consistency (identity vs assets)

| Cat | Spec identity | Full-body (`{id}.png`) | Portrait family | Issues |
|---|---|---|---|---|
| **Luna** | Medium calico, piano | Calico patches, medium sit, no accessory | Calico head peek | Strong match across families |
| **Milo** | Slim black / tuxedo, tenor sax; sunglasses | Slim dark cat, **hat + yellow bow tie + sunglasses** | Head peek with yellow glasses | Full-body richer than portrait; both read as Milo |
| **Maple** | Lean orange tabby, upright bass | Orange tabby, **sunglasses + teal bandana** | Peek without sunglasses/bandana | Accessory drift portrait ↔ floor |
| **Mochi** | Tiny cream kitten, drums | Clearly **smaller** silhouette, cream, sleepy eyes, **ear bandage + blue collar + gold tag** | Cream ear/head peek | Kitten scale preserved on floor; good |
| **Pepper** | Fluffy charcoal senior, trumpet; burgundy neckerchief | Fluffy charcoal + white blaze/chest/socks, **red neckerchief** | Charcoal/white peek; small prop dots (trumpet-ish) | Distinguishable mainly by fluff + no beanie |
| **Patches** | Chubby gray-and-white, jazz guitar | Same palette as Pepper, **black beanie + red neckerchief**, rounder mass | Peek **without beanie**; **drumstick / action marks** (wrong instrument cue) | **Highest confusion risk with Pepper**; portrait props wrong |
| **Chai** | Slender Siamese, vocals | Cream body, dark points, slim, dark collar + tag | Peek with **sunglasses** (not on floor) | Accessory drift; silhouette OK on floor |
| **Biscuit** | Large orange/brown tabby, turntables; headphones | Large round tabby, **black headphones** | Peek **without headphones** | Scale OK on floor; portrait drops signature accessory |

### Pepper vs Patches (priority)

- Coat pattern on full-body is **very similar** (charcoal + white muzzle/chest/socks).
- Reliable differentiators today: **Pepper = fluffier + neckerchief only**; **Patches = beanie + slightly chubbier mass**.
- Portraits weaken Patches’ beanie cue and introduce a **drumstick**, which fights the jazz-guitar identity.
- Recommendation for approval: treat **full-body** as identity source of truth; if portraits stay, they need beanie + guitar-side props for Patches and clearer senior fluff for Pepper — **after** visual approval (not in this phase).

### Mochi scale (priority)

- Full-body correctly reads as kitten vs Luna / Biscuit / Chai on the focus sheet and in the Profile chooser.
- Runtime Home uses a **fixed CSS/box size** (`size={220}`), so Mochi appears smaller *within* the box (more padding) rather than a smaller layout slot — acceptable for now; call out if product wants true world-scale on the rug.

---

## 5. Current rendering audit (app screenshots)

Captured with Playwright against local Vite (`390×844` mobile DPR2, `1280×900` desktop).

### Home

- Uses **full-body PNG** over cat-free room art — style aligns with botanical room.
- Same selected cat across lighting (sunshine seeded for captures).
- Representative: `screenshots/mobile/home.png`, `home-pepper.png`, `home-patches.png`, `home-mochi.png`, `home-biscuit.png` (+ desktop twins).

### Profile — selected companion

- Full-body PNG at 140px in companion card — same art family as Home.
- Representative: `screenshots/mobile/profile.png`, `profile-pepper-selected.png`.

### Profile — chooser

- Full-body PNG in cream squares, `object-fit: contain`, bottom-anchored — all eight readable; Mochi small; Pepper/Patches separable via beanie.
- Representative: `screenshots/mobile/profile-chooser.png`.

### Practice

- Companion lives on the **Player** tab (not Chords), below controls, hideable via Focus mode.
- Uses **portrait PNG at 48px** — different variant than Home/Profile.
- Representative: `screenshots/mobile/practice-player-companion.png` (Luna portrait visible in dashed companion strip). Chords-only shots intentionally omit the cat.

### Mismatches / framing notes

| Issue | Detail |
|---|---|
| Cross-surface variant split | Home/Profile = floor; Practice = portrait |
| Portrait accessory drift | Maple, Chai, Biscuit, Patches portraits disagree with floor signatures |
| SVG fallback style break | Pixel SVGs would clash if PNGs failed |
| Uniform box scaling | All cats share equal `width`/`height`; build differences are only within the art |
| Cards unused & corrupt | Not rendered; wrong content for Pepper–Biscuit cards |

---

## 6. Recommended authoritative artwork (pending approval)

**Do not implement until reviewed.** Priority: preserve existing illustrated assets; prefer one coherent family per surface.

| Context | Recommended asset | Rationale |
|---|---|---|
| Home room | **`{id}.png` (full-body)** | Already live; matches cozy illustrated aesthetic; clear identities |
| Profile chooser | **`{id}.png` (full-body)** | Already live; shows build (Mochi tiny, Biscuit large) |
| Profile selected | **`{id}.png` (full-body)** | Same source as Home — no identity split |
| Practice companion | **Option A (consistency):** switch to `{id}.png` at ~48–64px **or** **Option B (status quo):** keep `{id}-portrait.png` but plan portrait cleanup | Needs product call; portraits currently drift accessories |
| PNG load fallback | Keep `{id}.svg` short-term **or** later replace SVG with embedded full-body wrappers | Pixel SVGs are style-incompatible |

### Proposed for future removal / regeneration (not deleted now)

| Asset set | Proposal |
|---|---|
| `cards/{id}-card.png` | **Regenerate or remove** — Pepper/Patches/Chai/Biscuit cards are wrong board crops (animation sheets of other cats). Unused by runtime. |
| `{id}-icon.png`, `{id}-small.png` | Candidates to drop if unused after portrait decision (duplicates of portrait family). |
| Public `{id}.svg` pixel set | Candidates to replace with illustrated wrappers matching `{id}.png` once approved. |
| Repo-root `/jazz-cat-assets/` duplicates | Document as legacy pipeline output; avoid copying over public without review. |

### Missing variants (relative to approved concept)

- No production idle sprites with **instruments** (by design for chooser/Home — concept board still defines roles).
- No dedicated **stage prop** assets wired in-app for sax / bass / drums / trumpet / guitar / mic / decks.
- No corrected **Patches portrait** with beanie + guitar cue.
- Card art does not match concept “cat chooser” tiles from `APPROVED-VISUAL-REFERENCE.png`.

---

## 7. Approval checklist

Please confirm visually using the contact sheet + app screenshots:

1. [ ] Full-body `{id}.png` is the source of truth for Home + Profile.
2. [ ] Practice should keep portraits **or** move to full-body thumbnails.
3. [ ] Pepper vs Patches separation is acceptable as-is (beanie / fluff) **or** needs art revision.
4. [ ] Mochi kitten scale in equal-size boxes is acceptable.
5. [ ] Portrait accessory mismatches may wait for a later pass **or** are blockers.
6. [ ] Card / icon / small / pixel SVG cleanup may proceed after this audit (separate change).

---

## 8. Package contents

This folder is zipped as `character-art-review.zip` on the feature branch for download.

```
character-art-review/
  character-art-audit.md
  cat-art-contact-sheet.png
  eight-cat-comparison.png
  pepper-patches-mochi-focus.png
  svg-fallback-sprites.png
  approved-visual-reference-included.png
  jazz-cat-idle-extract-preview.png
  svg-rasters/*.png
  screenshots/mobile/*.png
  screenshots/desktop/*.png
```

**No production artwork under `web/public/jazz-cat-assets/` was modified in this phase.**
