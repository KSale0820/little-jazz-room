# Achievements redesign and new room assets (class-demo)

The approved mobile mockup determines the Achievements page styling and layout: warm background, centered header, large rainy-room scene, gentle empty state, segmented Achievements / My Collection tabs, reward previews and progress pills.

## Current art source (class-demo)
- Background: `web/public/achievements/empty-room-new.webp`, reference canvas **1706 × 922**.
- Active decorative sprite batch: `web/public/achievements/new-decor/01-...png` through `08-...png`.
- Source geometry: `web/public/achievements/new-decor/placements.json`. The page scales each x/y/width/height coordinate by 1706 × 922 to preserve pixel scale, position, alpha and supplied shadows. The room is not flattened.
- Old `room-base.png`, `armchair.png`, provisional armchair/music-stand/record-player SVGs and the former plant-stage sprites are removed from the achievements asset folder.
- Existing **approved** Luna, Milo and Maple cat artwork remains in the companion library. This removes obsolete *room decoration* artwork, not the companion system.

## Temporary reward presentation while the remaining sprites are being collected
The existing eight practice milestones are unchanged (no fake activity, no new earning criteria). Existing per-account earned achievement IDs and former visibility preferences are preserved/migrated.

- First Notes: piano trailing plant (#05)
- First Hour: Milo (existing approved companion) and bookshelf sleeping cat (#04)
- Finding Your Rhythm: bookshelf plants (#01)
- Routine Regular: piano sheet music (#08)
- Finding Your Groove: piano lamp (#07)
- Practice Companion: Maple (existing approved companion) and piano jazz busts (#06)
- Building a Habit: music books (#03)
- Jazz Collector: trumpet (#02)
- Luna: starter companion, optionally displayed

These visual associations can be revisited as future matching decoration sprites (including the record player and music stand) arrive. Original achievement IDs are **not** changed by this mapping. No missing asset is referenced as an image source.

## Interaction
- Tap an item to inspect its unlock; hide/show it in My Collection.
- Decoration positions 01–08 are fixed at the artist-provided reference coordinates. Only companion sprites currently offer an alternate pre-defined location.
- Display preferences remain local and account-scoped. Reset Arrangement does not remove achievements.
- Plant growth-stage art from the old batch is removed; detailed growth-stage rendering can return once matching **new** plant stage sprites exist.

## QA
Preview branch build, no CSS changes outside Achievements. Check 375px and 390px phones, empty and well-furnished states, account switching and unlock persistence. Do not use old assets as fallbacks.
