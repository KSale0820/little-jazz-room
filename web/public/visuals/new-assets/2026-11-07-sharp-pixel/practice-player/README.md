# Practice Player — individually exported pixel icons

The eight original missing symbols were exported as transparent 240 × 240 PNG and matching 40 × 40-grid SVG files. An additional transparent `play.svg` was added for the production player because the original isolated play PNG rendered as an opaque disk when recolored for Dark Mode.

| Name | Intended control |
|---|---|
| tuner | Tuner tool |
| mixer | Mixer tool |
| play | Accessible Play button; transparent SVG silhouette only |
| pause | Pause state of Play/Pause |
| skip-back | 10-second backward jump (with text label) |
| skip-forward | 10-second forward jump (with text label) |
| finish-check | Finish Session checkmark |
| step-up | BPM and key increment |
| step-down | BPM and key decrement |

PNG files: `png/`. SVG files: `svg/`. Icons have no embedded labels so the UI can remain accessible and localized. Prefer SVG for controls; use `image-rendering: pixelated` when scaling PNGs.

**Reuse PR #84** for repeat, metronome, clock, bookmark, and navigation icons. The player uses the transparent `svg/play.svg` for a theme-aware play silhouette. **Do not rasterize UI text:** the Loop label, BPM/key values and Original reset, chart, scrubber, session timer, and Finish Session label should remain real controls.

The implemented player references these files from `web/src/pages/PracticePage.tsx` and styles them in `PracticePlayerPixelV2.css`. Monochrome controls are CSS-masked to `currentColor` for legibility in both Light and Dark. The PR remains a draft until approved.
