# Progress pixel artwork (November 8, 2026)

These are **individual transparent PNG cutouts from the owner-approved original asset sheet**, not regenerated interpretations. The cropped sprites were palette-optimized and resized by nearest-neighbor, so their pixel edges remain crisp. All are independent assets.

- `piano-keys-wide.png`, `piano-keys-medium.png`, `piano-keys-compact.png`: interchangeable piano-key surfaces.
- `light-outline.png`, `light-active.png`, `dark-outline.png`, `dark-active.png`: theme control states.
- `cat-mode-outline.png`, `cat-mode-active.png`: Cat Mode off/on.
- `settings-outline.png`, `settings-filled.png`: settings button variants.

**Do not bake a cat into any piano.** The Progress page overlays the selected Luna, Milo, or Maple pixel sitting pose from the existing cat library, and maintains the selected companion when Cat Mode is turned off.

Implementation: `ProgressRedesignPage.tsx` uses the wide piano, the button states, existing selected-cat artwork, the real PracticeCalendar, the persisted session summaries, and the existing appearance context. Cat Mode defaults **on only when no saved choice exists**. A saved `false` remains off. Light/Dark choices are also persisted normally.

No recorded practice or session totals are mocked in the live page. Neither PR #84 nor the base theme integration was merged as part of this implementation.
