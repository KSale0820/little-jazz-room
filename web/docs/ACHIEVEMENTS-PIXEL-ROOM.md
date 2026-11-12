# Achievements room implementation (review branch)

Entry: Progress → My Little Jazz Room → `/achievements`.

## Source of truth
- The submitted approved blank room reference is **not** a runtime-generated image.
- The binary files `web/public/achievements/room-base.png` and  `web/public/achievements/armchair.png` must be copied from the supplied asset ZIP before visual signoff. The code handles missing assets with a temporary art fallback.
-  `web/public/achievements/armchair.png` is an independent transparent overlay, not flattened into the room. Armchair first appears after the user's first valid completed practice session.

## Implemented
- Eight proposed achievements based on actual positive-duration saved practice sessions.
- Existing permanent Luna (always), Milo (60 cumulative minutes) and Maple (300 cumulative minutes) compatibility.
- Session ID deduplication and invalid/zero duration guards.
- Local-day distinct-days and consecutive-days milestones.
- Per-account durable earned rewards and independent item-visibility settings.
- Room with clickable pixel layers, Details, Decorate, Collection filters, on/off switches, quiet notifications preference.
- No score, currency, forced celebration, forced interactions or new bottom navigation.
- Route entry from the existing pixel Progress screen and mobile Light/Dark styling.
- Unit tests of milestone logic and persistence.
- Existing approved cat sprites and plant/decor assets reused where possible.

## Verification and limitations
- This branch has **not** been promoted to the protected class demo branch.
- Full CI and screenshot QA should run against the combined branch.
- The source practice-session collection can contain only a bounded number of synced records for signed-in users. Permanent saved achievements and companion unlocks remain earned, but retroactive lifetime milestones from older truncated history cannot be reconstructed until a durable aggregate exists.
- The room's asset layers use fixed anchor positions, avoiding free drag/reordering for this MVP.
- Item placement and catalogue are starter examples; confirm visual scale/occlusion on 390×844 and 375×667 once actual PNGs are present.
- Local room preferences are device-scoped and account-scoped. Cloud room layout sync is **not** implemented.
- Quiet notifications setting is persisted for future reward UI but no global notification behavior is introduced.
