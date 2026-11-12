# Achievements mockup alignment (class-demo)

Base: `class-demo-2026-10-31`. This is a visual/interaction revision to the current achievements room, not the pixel-branch theme.

## Visual decisions
- Keep the approved blank rainy-room PNG as the main pixel-art image, with independently layered unlocked decorations.
- Center the Achievements title and My Little Jazz Room intro; use a warm, muted cream/cocoa/terracotta palette within this page.
- Add mockup-style empty-room message with unobtrusive cat-outline icon; display a small earned-count summary for returning users.
- Put mockup-style Achievements/My Collection segmented tabs under the room, with upcoming milestones first, earned milestones second.
- Show pixel-art reward previews and compact progress capsules instead of generic star emojis.
- Keep the room prominent on 375 and 390px viewports, with no new global typography or navigation changes.

## Behavior
- First Notes now unlocks the first houseplant, consistent with the design brief and mockup. The existing three-distinct-days milestone unlocks the armchair; previously earned achievement IDs are retained.
- Luna remains available from the start, and the blank initial mockup is preserved by the existing hidden-by-default Luna arrangement setting. Users can turn Luna on in My Collection.
- Preserve existing 60-minute Milo, 300-minute Maple, and all other existing milestones, with real saved session evidence.
- Decorate opens My Collection; each unlocked item can be toggled independently.
- Two predetermined placements per item are saved per local account; Reset Arrangement resets display preferences, not earned rewards.
- Keep the separate practice companion selection unchanged.
- Dark mode styling is scoped to `html[data-theme='dark']`; reduced motion is respected.

## Still pending approved assets
- Armchair and room base are the approved source PNGs already committed.
- New accessory poses, an extended decorative object set, and any custom achievement badge icons are **not** assumed present. Current reward icons use existing approved cat/decor PNGs and available SVG fallbacks.
- Do not introduce placeholder AI art or silently replace existing approved Luna, Milo, Maple sprites.

## Review
- Check /progress/achievements in the PR preview on 375x667 and 390x844.
- Check guest empty room, logged practice history, fully decorated room, manual show/hide, placement, reset, and account switching.
- Full CI may contain pre-existing `visualManifest.test.ts` inventory and `metronomeSync.test.ts` assertion failures. Check whether results match the base branch before attributing them to this PR.

**Do not merge into class demo until user reviews the visual direction.**
