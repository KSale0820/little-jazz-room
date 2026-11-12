# Achievements room: class-demo port

Source: PR #125, `feature/achievements-pixel-room-2026-11-12`. Target: `class-demo-2026-10-31`.

The room implementation and approved PNGs are reused, while the feature is routed through the existing class-demo Progress → Achievements tile at `/progress/achievements`. `/achievements` is an alias. The existing Practice, Tracks, Routines, Progress, and practice journal flows remain unchanged.

The eight achievements use real positive-duration completed sessions, support durable earned state and independently toggled room decorations, preserve Luna/Milo/Maple unlock milestones (0/60/300 minutes), and keep account-scoped local preferences. Theme styling uses class-demo's warm cream/green palette, without importing the pixel integration shell, theme toggles, or new Progress page.

Five plant-growth images and the PNG room/armchair artworks are copied as the exact Git blobs from the source branch. The room retains fixed-position decorations and does not implement drag-and-drop. Persistence is local/device scoped; signed-in history may be limited to recently synced sessions. The quiet celebrations toggle persists a preference but does not itself change global notifications.

Verify with `cd web && npm ci && npm run build && npm test` and inspect 375×667 and 390×844 in the deployed preview.