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

## Exact decorative-cat mapping (current baseline, **not** pixel replacements)

For each `id` = `luna`, `milo`, `maple`, `mochi`, `pepper`, `patches`, `chai`, `biscuit`:

| Pose | Existing approved source | Verified pixel replacement |
| --- | --- | --- |
| sleeping | `/visuals/cats/sleeping/{id}.png` | **not yet supplied** |
| sitting | `/visuals/cats/approved-class-mvp/sitting/{id}.png` | **not yet supplied** |
| floor | `/visuals/cats/approved-class-mvp/full-body/{id}.png` | **not yet supplied** |

`VERIFIED_PIXEL_CATS` is intentionally empty until **each** replacement sprite is visually reviewed on light and dark surfaces at its actual on-screen size. Do not fake poses through stretching/rotation. Avatar, chooser, achievement, and saved-unlock assets are unchanged.

## Verification gates for each pixel-cat batch

1. Transparent background, hard pixel edges at 1:1, markings and silhouette retained; no duplicate paws, tails, heads, or instruments.
2. Light/dark contact-sheet cells and mobile-size crops, readable facial detail; no clipping or conversion defects.
3. Each added `VERIFIED_PIXEL_CATS[pose][id]` URL exists in the public asset tree; original approved URL is fallback.
4. Run `npm run build`, unit tests, and 390x844 / 375x667 screenshots after Agent 2 connects existing slots.

**No cat variants are claimed complete in this foundation PR.** Coordination issue: https://github.com/KSale0820/little-jazz-room/issues/50.
