# Tracks and Charts — current approved UI

**Status:** owner-approved visual direction, November 7, 2026. This supersedes all older Tracks/T01 screenshot variants and the former "Listening Room" layout. Do not use older T01 comps to overwrite this screen.

## Definitive reference
The full-resolution source screenshot is **TRACKS-AND-CHARTS-APPROVED-UI.png**, included alongside the separately exported art in the conversation's `Little-Jazz-Room-Tracks-Approved-Assets.zip`. The PNG is the design authority. The GitHub connector used in this pass cannot upload raster binary files, so the PNG itself has **not yet been committed** to this repository. Upload that exact file here when binary file writing is available:

- `web/docs/approved-ui/TRACKS-AND-CHARTS-APPROVED-UI.png`

Do not treat older screenshot files as approved. Preserve historical QA captures rather than deleting them indiscriminately.

## Implementation in this branch

- `web/src/pages/TracksPage.tsx` replaces the prior page UI with the approved two-line pixel heading, instrument-study vignette, search, horizontal style filters, purple **Bookmarked** shortcut, and compact track/chart rows.
- `web/src/pages/TracksApproved.css` is scoped to T01; it reuses theme variables and keeps the bottom navigation, chart/practice routing, Supabase/local storage, and audio behavior unchanged.
- `web/public/visuals/tracks-approved/` has four handcrafted pixel-styled **SVG stand-ins** so the implementation is functional before the original PNG files can be uploaded. These are not claimed to be the exact generated PNG artwork.

## Final PNG asset mapping
| Original asset | Destination when binary upload is available | Usage |
| --- | --- | --- |
| `tracks-title.png` | `web/public/visuals/tracks-approved/tracks-title.png` | Header title image |
| `jazz-study-shelf.png` | `web/public/visuals/tracks-approved/jazz-study-shelf.png` | Header illustration |
| `bookmark-filled.png` | `web/public/visuals/tracks-approved/bookmark-filled.png` | Bookmark symbol |
| `bookmarked-card-reference.png` | `web/docs/approved-ui/bookmarked-card-reference.png` | Visual-only reference for the CSS bookmark shortcut |

After uploading, switch just three image `src` paths in `TracksPage.tsx` from `.svg` to `.png`. Do **not** rasterize the live card text, search, category controls, or navigation. The bookmark card is a clickable accessible DOM element.

## Approved constraints
- Page heading reads **Tracks and Charts** (not a second Charts tab/button).
- No Recommended banner or decorative cat on Tracks.
- Title has visibly crisp pixel styling, not watercolor softness.
- Search and style chips are functional.
- **Bookmarked** opens a saved-only view, and each row's bookmark toggles persist in the existing user-scoped localStorage key.
- Row primary/play actions open existing charts/player rather than claiming absent recorded audio.
- Keep the **current** app's navigation and theme system; the pictured nav is a visual reference, not permission to rewrite unrelated screens.
- No extra asset packs or obsolete T01 variants should be incorporated into the current Tracks design.

## QA to complete
Run `npm run build`, `npm test`, and mobile screenshots at 390×844 and 375×667 in Light and Dark. Check horizontal overflow, keyboard search, empty bookmarks, saving/un-saving after reload, and opening a chart from the filtered list. Validate full-resolution PNG integration separately.
