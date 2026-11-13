# Little Jazz Room Achievements (final furnished placement)

Source of truth: owner-approved `little-jazz-room-placements-v5-cats.json` (1706×922), Nov 12 2026. Exactly 24 independently addressable decor layers and six approved clean-pixel companion poses. The cats are loaded from `/visuals/cats/clean-pixel/` already present in the class demo branch. Existing room art is packed into a single lossless palette WebP atlas, displayed without resampling and positioned with the owner's exact x/y/width/height/rotation. The lamp sprite is the softened no-hard-halo sprite, plus a separately rendered low-opacity radial illumination effect behind the lamp.

The room retains eight achievement milestones; additional art unlocks alongside those milestones (no new prerequisites). Curtains, wall shelves, couch and one Luna pose are starter decor. The Furnished Preview button shows all layers for visual evaluation **without** marking milestones earned or changing user preferences. In the regular view, My Collection allows independently showing/hiding unlocked items. All user-facing placement uses the saved editor coordinates, not generic placeholders. No missing plants were recreated.

Art data: `web/src/features/achievements/roomArt.ts`. Style and page: `web/src/pages/AchievementsPage.*`. Atlas: `web/public/achievements/room-decor-atlas.webp` (1536×1581, nearest-neighbor color-quantized from original layers for lossless pixel edges).

Verification: `cd web && npm ci && npm run build && npm test`; review preview at 375px and 390px mobile widths, both furnished preview and empty account.