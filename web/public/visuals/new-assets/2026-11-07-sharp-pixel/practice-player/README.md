# Practice Player — individually exported pixel icons

These eight new symbols fill gaps in PR #84 without replacing any existing approved assets. Each icon is transparent, sharp at a 40 × 40 pixel design grid, and supplied in both a 240 × 240 PNG and an SVG that preserves the same pixel shapes.

| Name | Intended control |
|---|---|
| tuner | Tuner tool |
| mixer | Mixer tool |
| pause | Pause state of Play/Pause |
| skip-back | 10-second backward jump (with text label) |
| skip-forward | 10-second forward jump (with text label) |
| finish-check | Finish Session checkmark |
| step-up | BPM and key increment |
| step-down | BPM and key decrement |

PNG files: `png/`. SVG files: `svg/`. Icons have no embedded labels so the UI can remain accessible and localized. Prefer SVG for controls; use `image-rendering: pixelated` when scaling PNGs.

**Reuse PR #84** for play, repeat, metronome, clock, bookmark, and navigation icons. **Do not rasterize UI text:** the Loop label, BPM/key values and Original reset, chart, scrubber, session timer, and Finish Session label should remain real controls.

Assets only. No application code, manifests, original assets, or live controls are changed. PR #84 remains a draft until approved.
