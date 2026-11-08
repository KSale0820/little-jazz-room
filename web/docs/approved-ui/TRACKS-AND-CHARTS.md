# Tracks and Charts — approved reference UI

**Current design authority:** `web/docs/approved-ui/TRACKS-AND-CHARTS-APPROVED-UI.png` (November 7, 2026).
This screenshot supersedes older T01/Tracks mockups, the Listening Room header, and all recommended/cat-banner experiments. Historical QA screenshots may remain archived but are not the design authority.

## Exact original assets installed and active

All three assets below are the exact source PNG bytes, uploaded and verified against their Git blob SHA-1 values; they are **committed to this feature branch**.

| Asset | Repository path | Git blob SHA-1 |
| --- | --- | --- |
| Title | `web/public/visuals/tracks-approved/tracks-title.png` | `335ae69bef57590e8c7a8ed6b619174dbab1198e` |
| Instrument-study shelf | `web/public/visuals/tracks-approved/jazz-study-shelf.png` | `d3f5db262e147080af2968be4839b6fdadce5f0c` |
| Approved reference screenshot | `web/docs/approved-ui/TRACKS-AND-CHARTS-APPROVED-UI.png` | `f307c26a5428a4be12ea61adde4dc2e377efe689` |

The live Tracks page references the exact title/shelf PNGs, **not SVG stand-ins**. The previous temporary title/shelf SVGs and one-time installer script have been retired.

Also reused existing transparent pixel PNG icons from PR #84: `record.png`, `bookmark.png`, and `chevron.png`, copied by their verified Git blob identifiers. The bookmark and record SVG fallbacks remain registered only for other legacy uses or potential empty states.

## Implementation scope

- `web/src/pages/TracksPage.tsx` provides the combined Tracks and Charts library: search, horizontally scrolling genre chips, compact chart/track rows, and a purple **Bookmarked** shortcut that filters saved items.
- `web/src/pages/TracksApproved.css` implements the approved layout in the existing Light/Dark theme system.
- `web/src/assets/visualManifest.ts` indexes the exact assets to satisfy the repository's strict visual-asset tests.
- Existing chart-player navigation, saved favorites per account, recording availability checks, advanced filters, bottom navigation, routines, and practice data remain functional.
- Live text, bookmarks, play controls, search and filters remain native interactive components; **do not** embed the whole screenshot as a runtime background.

## Locked decisions

1. Page title: **Tracks and Charts**, stacked and pixel-styled.
2. No separate Charts button, Recommended section, or decorative companion cat on Tracks.
3. Exact approved study-shelf illustration appears beside the title.
4. Saved/bookmarked tunes are accessible with a dedicated shortcut.
5. Bottom navigation stays the current application's Practice / Tracks / Routines / Progress structure; the static mockup's navigation is a visual reference, not a request to change routes.
6. Do not reintroduce older mockups or substitute regenerated assets without approval.

## Validation

Run `npm run build`, `npm test`, and mobile Light/Dark screenshots at 390×844 and 375×667; verify assets render without distortion, search, bookmarks/reload, filters and chart → player. PR #86 is held for visual review. Do not deploy or merge without an explicit owner request.
