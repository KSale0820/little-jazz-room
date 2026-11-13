# Achievements mockup alignment: iteration 2

Scope: Achievements page only. Current class-demo room art, object coordinates, account-specific unlock persistence, collection filter, cat poses, and global bottom navigation are unchanged.

Visual reference: user-approved green cozy city-apartment pixel-art mockup.

## Corrections relative to the screenshots from November 13, 2026
1. Restore a continuous hanging-ivy canopy across the top of the Achievements header (using the user-generated garland, resized and quantized solely for browser delivery).
2. Reconnect room progress plaque and Achievements/Collection tabs with one wooden apartment display shelf beneath the room (using the user-generated illustrated bookshelf/shelf art).
3. Move "Preview fully furnished room" from a free-standing row to a small, accessible preview button within the room scene, removing the visual gap separating room and shelf.
4. Make milestone cards compact like the mockup: icon, title, description, and right-aligned status. Show a real progress bar underneath the numeric progress rather than below the description.
5. Feature the next upcoming milestone initially; reveal every other upcoming milestone through the existing "See all" action. Keep live user evidence, not placeholder progress.
6. Reduce card, title and tab padding so it resembles the dense game panel more closely without changing touch target placement in the bottom nav.
7. Retain the original approved empty room and all 23 layered decorations, with dynamic achievements and independent room visibility.

## Files
- Page UI: \`web/src/pages/AchievementsPage.tsx\` and \`.css\`
- Art: \`web/public/achievements/ui/ivy-garland.png\` and \`wood-shelf.png\`
- No edits outside the achievements route.
