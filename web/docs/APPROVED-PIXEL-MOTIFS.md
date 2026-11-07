# Approved Pixel Motifs: 19 independent sprites

Owner approval: November 5, 2026. Includes the ten second-pass polished motifs; `staff-wave` is the final corrected version with standard eighth-note flags.

## Integration contract

- All 19 individually loadable, transparent PNGs are under `web/public/visuals/pixel-motifs/approved/`.
- `VISUAL_ASSETS.approvedPixelMotifs` and `APPROVED_PIXEL_MOTIFS` in `web/src/assets/cleanPixelAssets.ts` expose stable names.
- Keep existing `VISUAL_ASSETS.pixelMotifs` SVG masks intact. They are needed for existing CSS mask usage and rollback.
- All PNGs share the **same artwork** across Sunny Studio (Light) and Midnight Jazz (Dark). Use theme palette tokens only for surrounding UI, not new generated asset variants.
- Use images sparingly. Small decorative plants, music-note flourishes and section dividers only; no new backgrounds, layout movement, interactions, audio/control replacement or animation.
- Keep Cat Mode separate: decorative cats may toggle but avatars, selection, rewards and saved unlocks persist.
- Agent 2 owns page placement and Agent 1 owns theme colors. This is an asset-only PR; do not change their files in parallel.
- Static QA: `/qa/approved-pixel-motifs.html` presents every image on both palette surfaces. Native PNG dimensions are intentionally modest for sharp pixel scaling (set `image-rendering: pixelated` when enlarged).

## Individual mappings

| Key | File | Status |
| --- | --- | --- |
| beamedNotes | `beamed-notes.png` | polished |
| centerDot | `center-dot.png` | previous approved |
| centerLeaf | `center-leaf.png` | previous approved |
| cornerLeft | `corner-left.png` | polished |
| cornerRight | `corner-right.png` | polished |
| dividerLeaf | `divider-leaf.png` | previous approved |
| dividerNote | `divider-note.png` | polished |
| eighthNote | `eighth-note.png` | polished |
| hangingPlant | `hanging-plant.png` | polished |
| ivyTrail | `ivy-trail.png` | previous approved |
| leafCluster | `leaf-cluster.png` | previous approved |
| plantPot | `plant-pot.png` | polished |
| planterBox | `planter-box.png` | polished |
| plusSparkle | `plus-sparkle.png` | previous approved |
| smallPlant | `small-plant.png` | previous approved |
| sparkleCluster | `sparkle-cluster.png` | previous approved |
| sparkle | `sparkle.png` | previous approved |
| staffWave | `staff-wave.png` | corrected/polished |
| trebleClef | `treble-clef.png` | polished |

No deletions or changes to approved cat originals, companion logic, reward logic, global styles or page layouts.
