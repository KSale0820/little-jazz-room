# Achievements room: class-demo port (asset migration)

The original achievements port from PR #126 provided the baseline room system with eight durable achievements, cat thresholds (Luna 0 / Milo 60 / Maple 300 minutes), collection visibility and account-scoped persistence.

As of the new-assets migration, the page uses **only** the updated `/achievements/empty-room-new.webp` and the latest `/achievements/new-decor/` cropped transparent art for the illustrated room. Older `room-base.png`, `armchair.png`, and provisional SVG/plant sprites have been removed. The approved companion sprite library remains unchanged.

See `web/docs/ACHIEVEMENTS-MOCKUP-ALIGNMENT.md` for the currently implemented sprite mapping, known pending assets, and source `placements.json`.

Achievement earning is based on valid saved practice sessions. Unlock states remain independent of decoration visibility. The app's journal, routine, player and Progress routes have not been changed by this asset migration.
