# Achievements Room | New art batch 01–08

This folder holds the **eight new generated furniture and decoration sprites** from the approved furnished-room reference. The new empty room lives at `/achievements/empty-room-new.webp` and is the new class-demo scene background. The original full-resolution source PNG and all eight original generation PNGs are preserved in the downloadable source ZIP delivered in ChatGPT.

## Asset manifest

See [placements.json](./placements.json) for reference coordinates in the 1706×922 room, sprite URLs, and display sizes. Each sprite has been cropped to its visible transparent bounds and downsampled with nearest-neighbor to an in-room pixel-art resolution. Shadows and lamp glow remain within their PNG alpha.

**Included:** 1 bookshelf plants, 2 trumpet, 3 music books, 4 sleeping cat on cushion, 5 piano plant, 6 two busts, 7 piano lamp, 8 loose sheet music.

**Excluded deliberately:** 9 piano-bench cushion, 10 couch/sofa.

These sprites are **source art**, not new unlock conditions. The existing Achievements page preserves its rewards, cat modes, saved preferences and companion thresholds. Connect new decor IDs only when separately specified; do not silently reassign existing milestones. To position the new art, place it in the same 1706×922 coordinate system and scale uniformly using `image-rendering: pixelated` and `object-fit: contain`.
