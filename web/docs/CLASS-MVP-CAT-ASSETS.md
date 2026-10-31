# Class MVP: approved cat assets

Source: user-provided `little-jazz-room-approved-assets-biscuit-supported.zip` (October 31, 2026).

**Authority:** These eight pixel-style cats replace earlier art for the class MVP. Do not regenerate or substitute cat illustrations. Eight names/instruments stay as defined in `CatCompanion.tsx`.

A repo-ready ZIP was prepared from the user upload. It preserves all 24 PNG files byte-for-byte but normalizes their directory/file names. Extract that archive **at the repository root**, creating:

- `web/public/visuals/cats/approved-class-mvp/full-body/{id}.png`
- `web/public/visuals/cats/approved-class-mvp/profiles/{id}.png`
- `web/public/visuals/cats/approved-class-mvp/closeups/{id}.png`

For each of: `luna`, `milo`, `maple`, `mochi`, `pepper`, `patches`, `chai`, `biscuit`.

The uploaded original ZIP's `manifest.json` has some filenames and image dimensions that don't match the PNGs. **Use the corrected manifest in the repo-ready ZIP** rather than the original manifest.

The central `visualManifest.ts` now uses these paths first, with older images as safety fallbacks. Progress uses `CatSprite` and Home/Profile/chooser already use that component.

Once copied locally, run `cd web && node scripts/verify-approved-cats.mjs` and `npm run build`. Then review all eight cats in Home, Progress, and Profile/chooser at 390×844 and a smaller phone size.

**No sleeping variants are included**. Do not fake poses by stretching or rotating these characters. Existing full-body sprites include instruments; Home scene positioning may need a later design-specific pass to avoid duplicate instruments (especially Luna/piano).

**Important:** The GitHub PR modifies text source files only. Binary assets must still be extracted and committed to the demo branch before the new artwork can render in a hosted preview. The fallback may hide missing files, so verify with the script, not just the browser.
