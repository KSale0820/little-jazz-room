# Achievements green pixel-game refresh
Base: `class-demo-2026-10-31`. This revision is scoped to the Achievements page only.

## Visual identity
- Forest green, sage, cream, soft wood/gold accents, urban rainy jazz-apartment feel.
- Dark-green retro title bar; leafy top corners; room artwork and all object positions unchanged.
- Pixel header and ornament art copied as byte-identical blobs from the approved PR #131 artwork archive; copyright/ownership remains as in that repository.
- Blank two-tab PNG from the approved chat asset is installed as `/achievements/ui/collection-tabs-blank.png`. Labels, active selection, icon strokes, and focus are live DOM elements. The image is reflected horizontally when Collection is active.
- Compact room-stat shelf, dynamic level name, earned achievements and displayed item counts. No baked-in user values in assets.
- Unlocked Treasures first, followed by next real milestones; the progress bars use `achievementProgress` and existing evidence. No sample streak or fake reward is inserted.
- Collection uses two-column collectible tiles, per-item category tint, visible/hidden buttons, existing cat pose selectors, and category filters.
- On desktop use a three-column Collection grid; mobile retains the original bottom navigation.

## Behavior preserved
- Original room-base file `empty-room-new.webp` and all room atlas/decor/cat layers and coordinates.
- All current achievement IDs, thresholds, bonus unlocks, saved earned state, visibility/pose preferences, reset control, furnished preview, category filtering and account isolation.
- Original tab interactions, show/hide behavior and accessible focus states.
- Light/dark theme compatibility and reduced-motion styling.

## Art sources
Archive: `web/asset-library/pixel/visuals/pixel-motifs/approved/`.
Copied to `web/public/achievements/ui/`:
`corner-left.png`, `corner-right.png`, `divider-leaf.png`, `plant-pot.png`, `hanging-plant.png`.
Additional generated asset: `collection-tabs-blank.png` (optimized lossless mobile-sized PNG).

## QA
- Verify at 375×667 and 390×844; empty and seeded histories.
- On Collection verify cat pose controls, individual display toggles, categories and return to Achievements.
- Check newest class-demo art after concurrent branch work; do not restore deleted legacy room or cat images.
