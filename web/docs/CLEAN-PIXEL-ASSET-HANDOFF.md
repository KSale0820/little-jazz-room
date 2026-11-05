# Clean pixel assets: Agent 3 handoff

## Dependency and integration

- **Not ready to merge until Agent 1 supplies** `web/src/context/AppearanceContext.tsx` with persisted `catMode` on `useAppearance()`, as specified in `web/docs/CLEAN-PIXEL-THEMES.md`.
- `DecorativeCat` API: `<DecorativeCat catId={catId} variant="sleeping" size={204} className="g01-cat" />` (also `sitting` and `floor`; no new poses).
- Agent 2 owns screen placements. The image retains `jazz-cat-sprite` and provided class names so `.g01-cat.jazz-cat-sprite` CSS continues to work. `visibility:hidden` preserves size. Home's decorative-cat wrapper must also avoid invisible pointer interception when Cat Mode is off, without deleting its layout slot.
- No Settings changes, layout edits, theme changes, animation changes, or avatar/reward wiring in this patch.

## Assets

- `/visuals/pixel-motifs/plant.svg`
- `/visuals/pixel-motifs/leaves.svg`
- `/visuals/pixel-motifs/music-notes.svg`

All are simple single-ink geometric SVG masks designed at a 24px pixel grid. Use a CSS mask with `background-color: var(--color-action)` or another semantic color. Do not rely on `<img>` inheritance of CSS color.

## Actual placement audit (integration branch, November 4)

| Screen/component | Existing art | Cat Mode handling |
| --- | --- | --- |
| Home `h01-companion` | `sleepingFile(catId)` | Decorative: use `DecorativeCat` and disable invisible button hit target when off |
| Progress `g01-cat` | `CatSprite sleeping` | Decorative: use `DecorativeCat`; retain change-companion control |
| Tuner `tool-scene-cat` | `sleepingFile(catId)` | Decorative: use `DecorativeCat` |
| Metronome `tool-scene-cat` | `sittingFile(catId)` | Decorative: use `DecorativeCat`; sitting originals are already pixel-styled |
| Practice completion footer | `CatSprite floor` | **Reward/celebration**: keep available regardless of Cat Mode |
| GuidedCatCoach | `CatSprite closeup` + instructional tips | **Instructional component**: preserve tips and associated selection; do not hide functional content |
| Profile / CatChooser | profile/floor/cropped portraits | **Identity/selection**: never gate by Cat Mode |
| Achievements / saved unlocks | achievement art and data | **Reward/data**: never gate by Cat Mode |

Static browser comparison for all three current poses and all eight companions:
`web/public/qa/clean-pixel-cat-contact-sheet.html`, served as `/qa/clean-pixel-cat-contact-sheet.html`.
It uses original files, no copied or regenerated art, with each cat on both token surfaces.

## Exact decorative-cat mapping (existing pixel sleeping sprites reused)

For each `id` = `luna`, `milo`, `maple`, `mochi`, `pepper`, `patches`, `chai`, `biscuit`:

| Pose | Existing approved source | Verified pixel replacement |
| --- | --- | --- |
| sleeping | `/visuals/cats/sleeping/{id}.png` | **reuse the exact approved source** (128×128 pixel art, crisp scaling) |
| sitting | `/visuals/cats/approved-class-mvp/sitting/{id}.png` | **not yet supplied** |
| floor | `/visuals/cats/approved-class-mvp/full-body/{id}.png` | **not yet supplied** |

All eight sleeping cats are already native pixel sprites. No new image exports are needed for the two actual decorative placements, Home and Progress. The comparison sheet is [`clean-pixel-sleeping-cats-light-dark.svg`](./clean-pixel-sleeping-cats-light-dark.svg), embedding the exact original PNG bytes for both semantic surfaces. The eight original PNGs stay unchanged; the component uses crisp pixel rendering when upscaled.

`VERIFIED_PIXEL_CATS` is deliberately empty because it tracks **new replacement files**, not approved existing pixel art. Sitting and floor PNGs are retained for portraits/selection and may not be used as decorative replacements without evidence of a real placement. Do not fake poses through stretching/rotation. Avatar, chooser, achievement, and saved-unlock assets are unchanged.

## Verification gates for each pixel-cat batch

1. Transparent background, hard pixel edges at 1:1, markings and silhouette retained; no duplicate paws, tails, heads, or instruments.
2. Light/dark contact-sheet cells and mobile-size crops, readable facial detail; no clipping or conversion defects.
3. Each added `VERIFIED_PIXEL_CATS[pose][id]` URL exists in the public asset tree; original approved URL is fallback.
4. Run `npm run build`, unit tests, and 390x844 / 375x667 screenshots after Agent 2 connects existing slots.

**All eight existing sleeping variants are reused and inspected; no new raster cats are claimed.** Coordination issue: https://github.com/KSale0820/little-jazz-room/issues/50.
