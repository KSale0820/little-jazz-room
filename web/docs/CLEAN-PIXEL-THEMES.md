# Clean Pixel Themes: implementation contract

Status: integration work on `integration/clean-pixel-themes`. Base: `class-demo-2026-10-31` at `35beaad3234c994060ed4590c45de74151c41197` (2026-11-04). Current application code and page geometry are authoritative. Older mockups and handoffs do **not** authorize route or behavior changes.

## File ownership (no parallel edits to shared files)
- **Controller / Agent 1, exclusive:** `web/src/context/AppearanceContext.tsx`, `web/src/App.tsx`, `web/index.html`, `web/src/styles/globals.css`, `web/src/components/AppShell.*`, Profile/Settings appearance controls in `web/src/pages/ProfilePage.tsx` and `ProfilePage.css` (coordinate any profile restyle by Agent 2), `web/docs/CLEAN-PIXEL-THEMES.md`, QA docs and workflow.
- **Agent 2, exclusive:** screen-specific visual CSS/TSX in `web/src/pages/**` except `ProfilePage.tsx` and `ProfilePage.css`; those two are controller-owned. May touch `web/src/components/ChordGrid.css`, `PageAtmosphere.*`, `JazzRoomScene.css`, `RoomArt.tsx` only after explicit owner confirmation. No shared foundation, routes, playback logic, data/repository or persistence edits.
- **Agent 3, exclusive:** `web/src/assets/visualManifest.ts`, existing pixel decorative assets under `web/public/visuals/` only, `web/src/features/cats/DecorativeCat.tsx` + its CSS. Existing `CatCompanion.tsx` and cat selection/saving are read-only unless controller agrees. Only approved existing placements may use `DecorativeCat`; Agent 2 makes placement switches in its owned pages, with no change to geometry.
- Changes to overlapping components require a PR comment and a controller-owned commit, never simultaneous edits. Agents must branch from current integration, send small PRs **to integration** and refresh from integration before each batch.

## Semantic tokens (V2: 2026-11-05 mood-board refresh)

**Midnight Jazz** is the dark plum/lavender theme; **Sunny Studio** is the warm ivory/sage theme. These are two palettes for **one** application layout, not separate apps. The attached daytime/nighttime pixel-cat/plant mood boards set *color and motif treatment*, not permission for new full-room illustrations. No new large backgrounds, new animations, page geometry changes or body/chord pixel typography.

`html[data-theme="light"|"dark"]` sets all tokens in `web/src/styles/globals.css`. Agent 2 uses semantic tokens in screen CSS, never hardcodes theme colors. Controller exclusively edits palette definitions.

| Semantic token | Sunny Studio (Light) | Midnight Jazz (Dark) |
| --- | --- | --- |
| `--color-bg` | `#FFF8EC` | `#1B1727` |
| `--color-surface` | `#FFFDF8` | `#292139` |
| `--color-surface-raised` | `#F3EBD9` | `#382C4D` |
| `--color-text` | `#312C34` | `#F9F3F9` |
| `--color-muted` | `#605866` | `#C7BAD5` |
| `--color-border` | `#D9C7CE` | `#6B587F` |
| `--color-action` | `#2C624A` | `#BCA3F4` |
| `--color-action-text` | `#FFFFFF` | `#24182F` |
| `--color-focus` | `#7953B4` | `#E5B9FF` |
| `--color-success` | `#2D7655` | `#93DBB7` |
| `--color-warning` | `#976023` | `#F6CA8C` |
| `--color-danger` | `#AC3A55` | `#FF9CAF` |
| `--color-violet` | `#7753A6` | `#C8A5FF` |
| `--color-pixel-plant` | `#679C72` | `#A7CF94` |
| `--color-pixel-note` | `#A26F9D` | `#ECAAD5` |
| `--color-chart-paper` | `#FFFEFA` | `#211A2F` |
| `--color-chart-chord` | `#2D3531` | `#F8F0F9` |
| `--color-chart-section` | `#9E3156` | `#F6AEC9` |
| `--color-chart-repeat` | `#2C588D` | `#99D7FF` |
| `--color-chart-selected` | `#EDE2F6` | `#38294E` |
| `--color-chart-selected-outline` | `#7753A6` | `#D8AEFC` |
| `--color-chart-loop` | `#E0F0E7` | `#292D4F` |
| `--color-chart-playhead` | `#67419B` | `#D5B5FF` |

Contrast target: at least WCAG AA 4.5:1 for normal-sized chord text, chart annotations, form labels and selected cell text. For dark selected cells, near-white chords against violet-tinted paper must remain legible; do not use gold-tinted selection fill, white paper under mint chords or color alone to distinguish loop/playhead/selection. Use different border/fill/underline patterns **without changing chart grid geometry**, and test a cell that is selected, looped and current simultaneously. Keep legacy palette aliases in global CSS for gradual migration.

## Appearance preference API
Import `useAppearance` from `../context/AppearanceContext` (or the corresponding relative path). Returns `{ theme, mode, setMode, catMode, setCatMode }`; `mode` is `'system' | 'light' | 'dark'` (only Light/Dark are user-selectable), `theme` is resolved `'light' | 'dark'`; `catMode` is a boolean. Keys: `little-jazz-room:appearance:v1` (absent = system, stored values `light|dark`), `little-jazz-room:decorative-cats:v1` (absent = false). Provider mounts above authentication so first paint, sign-in and offline mode share appearance. An inline `index.html` bootstrap sets `html[data-theme]` before module CSS to prevent wrong-theme flash. System changes apply while mode is `system`. Body classes/legacy cat-motion preferences are unrelated.

## Cat Mode and companion API (V2 override)

**Progress is the deliberate exception:** the **selected companion always remains visible**, even with Cat Mode OFF. Cat Mode OFF uses `<CatSprite catId={catId} variant="sleeping" decorative />` (original approved art); Cat Mode ON uses `<DecorativeCat catId={catId} variant="sleeping" />` (verified pixel replacement with approved fallback). Its `g01-cat` CSS footprint, cat-selection navigation, identity and stored data stay identical. The introductory speech bubble and Change button are not hidden with Cat Mode. If a given cat lacks a verified pixel replacement, retain approved artwork until Agent 3 verifies its raster variant; never silently replace identity.

Only optional scene cats on legacy Home, **Tuner**, and **Metronome** hide with Cat Mode OFF, using `visibility:hidden` rather than `display:none`. `DecorativeCat` still takes `catId`, `variant`, `size`, `className`. Do not add new placements. Avatars, profile/chooser/achievements, completion reward cats and saved unlocks are always unaffected.

Owner boundaries: **controller** owns `ProgressPage.tsx` for this narrow appearance behavior, `globals.css` Cat Mode gating and QA. **Agent 3** owns added raster PNGs and manifest/test mapping, not Progress or shared provider; **Agent 2** owns chart and screen-only styling, not Progress switching logic. This overrides old instructions saying Cat Mode hides the Progress sprite.

## Baseline and QA
Existing pre-change reference captures (not new-theme screenshots): [P02 iPhone screen folders](../docs/screenshots/class-demo/p02/) and [earlier app mobile captures](../docs/screenshots/current-app/mobile/). The current P01/P02 implementation is the layout authority, not earlier captures. PR #49 was merged into the demo separately by another workflow and is included in the integration base; do not merge any other unrelated PRs.

Acceptance matrix: Light/Dark x Cat Mode off/on, both 390x844 and 375x667; Progress cat visible in both and optional tool cats off/on, stable hit targets, focus, disabled, dialogs, chart notation, safe area, no shift when cats hidden, reload persistence, Chart -> Practice -> Finish -> Progress and Chart -> Exercise -> Routine -> Practice. Verify existing audio, tuner, metronome and recording; run `npm run build`, `npm test`, mobile Playwright. Log baseline failures separately from theme regressions. Screenshots and results must identify exact commit SHA. Never merge into the demo branch or master or deploy without explicit final approval.
