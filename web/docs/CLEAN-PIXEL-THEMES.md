# Clean Pixel Themes: implementation contract

Status: integration work on `integration/clean-pixel-themes`. Base: `class-demo-2026-10-31` at `35beaad3234c994060ed4590c45de74151c41197` (2026-11-04). Current application code and page geometry are authoritative. Older mockups and handoffs do **not** authorize route or behavior changes.

## File ownership (no parallel edits to shared files)
- **Controller / Agent 1, exclusive:** `web/src/context/AppearanceContext.tsx`, `web/src/App.tsx`, `web/index.html`, `web/src/styles/globals.css`, `web/src/components/AppShell.*`, Profile/Settings appearance controls in `web/src/pages/ProfilePage.tsx` and `ProfilePage.css` (coordinate any profile restyle by Agent 2), `web/docs/CLEAN-PIXEL-THEMES.md`, QA docs and workflow.
- **Agent 2, exclusive:** screen-specific visual CSS/TSX in `web/src/pages/**` except `ProfilePage.tsx` and `ProfilePage.css`; those two are controller-owned. May touch `web/src/components/ChordGrid.css`, `PageAtmosphere.*`, `JazzRoomScene.css`, `RoomArt.tsx` only after explicit owner confirmation. No shared foundation, routes, playback logic, data/repository or persistence edits.
- **Agent 3, exclusive:** `web/src/assets/visualManifest.ts`, existing pixel decorative assets under `web/public/visuals/` only, `web/src/features/cats/DecorativeCat.tsx` + its CSS. Existing `CatCompanion.tsx` and cat selection/saving are read-only unless controller agrees. Only approved existing placements may use `DecorativeCat`; Agent 2 makes placement switches in its owned pages, with no change to geometry.
- Changes to overlapping components require a PR comment and a controller-owned commit, never simultaneous edits. Agents must branch from current integration, send small PRs **to integration** and refresh from integration before each batch.

## Semantic tokens
Declared on `html[data-theme="light"|"dark"]` in `globals.css`; always reference tokens, not hardcoded aesthetic colors.

| Token | Light | Dark |
| --- | --- | --- |
| `--color-bg` | `#F5F7F3` | `#111A17` |
| `--color-surface` | `#FFFFFF` | `#1B2621` |
| `--color-surface-raised` | `#EBF2EC` | `#25332B` |
| `--color-text` | `#203028` | `#F3F5ED` |
| `--color-muted` | `#55685F` | `#B1C7BC` |
| `--color-border` | `#C9D6CD` | `#42574B` |
| `--color-action` | `#23654D` | `#72E6B4` |
| `--color-action-text` | `#F8FFF9` | `#0E2017` |
| `--color-focus` | `#8C46D1` | `#C7A7FF` |
| `--color-success` | `#227250` | `#79E6AA` |
| `--color-warning` | `#9B660F` | `#F0C573` |
| `--color-danger` | `#B13A49` | `#FF8FA1` |
| `--color-violet` | `#7058AB` | `#BF9AF2` |
| `--color-chart-paper` | `#FFFFFF` | `#1C2822` |
| `--color-chart-chord` | `#1C563E` | `#A0EFCA` |
| `--color-chart-section` | `#9B273F` | `#FF809B` |
| `--color-chart-repeat` | `#225BAA` | `#8CACFF` |
| `--color-chart-selected` | `#F5E6B5` | `#4F4930` |

Legacy aliases `--cream`, `--paper`, `--page-bg`, `--ink`, `--evergreen`, `--sage`, `--sage-soft`, `--border`, `--green` map to semantic tokens for gradual migration. Keep typography and spacing; pixel motifs never replace chart glyphs or body text. Use sparse pixel plant and music-note flourishes, not large illustrations or animated backgrounds.

## Appearance preference API
Import `useAppearance` from `../context/AppearanceContext` (or the corresponding relative path). Returns `{ theme, mode, setMode, catMode, setCatMode }`; `mode` is `'system' | 'light' | 'dark'` (only Light/Dark are user-selectable), `theme` is resolved `'light' | 'dark'`; `catMode` is a boolean. Keys: `little-jazz-room:appearance:v1` (absent = system, stored values `light|dark`), `little-jazz-room:decorative-cats:v1` (absent = false). Provider mounts above authentication so first paint, sign-in and offline mode share appearance. An inline `index.html` bootstrap sets `html[data-theme]` before module CSS to prevent wrong-theme flash. System changes apply while mode is `system`. Body classes/legacy cat-motion preferences are unrelated.

## Decorative-cat API
Agent 3 exposes `<DecorativeCat catId={catId} variant="sleeping" size={204} className="..." />` with the existing CatSprite shape, no new locations, poses or animations. When Cat Mode is off, render an invisible **same-size footprint** (e.g. `visibility:hidden`, not `display:none`), preserving stage geometry and hit targets; decorative wrappers can use `data-decorative-cat`. Only scene cats are affected. Keep all `CatSprite` avatars in profile, chooser, rewards, and achievements visible regardless of Cat Mode. **Never gate saved companion selection or rewards.** The controller may apply temporary placement-specific CSS gating before this component is adopted.

## Baseline and QA
Existing pre-change reference captures (not new-theme screenshots): [P02 iPhone screen folders](../docs/screenshots/class-demo/p02/) and [earlier app mobile captures](../docs/screenshots/current-app/mobile/). The current P01/P02 implementation is the layout authority, not earlier captures. PR #49 (player controls redesign) remains separate; do not merge unrelated PRs to obtain new UI.

Acceptance matrix: Light/Dark x Cat Mode off/on, both 390x844 and 375x667; stable hit targets, focus, disabled, dialogs, chart notation, safe area, no shift when cats hidden, reload persistence, Chart -> Practice -> Finish -> Progress and Chart -> Exercise -> Routine -> Practice. Verify existing audio, tuner, metronome and recording; run `npm run build`, `npm test`, mobile Playwright. Log baseline failures separately from theme regressions. Screenshots and results must identify exact commit SHA. Never merge into the demo branch or master or deploy without explicit final approval.
