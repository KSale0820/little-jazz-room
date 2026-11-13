# Little Jazz Room: unique pixel asset archive

This is an **artwork-only preservation library** for the retired pixel UI experiment. No production interface code, CSS, routes, scripts, theme toggles, or active asset mappings are changed.

## Scope
- **130 byte-distinct images** (17,702,132 bytes) not already present in the class-demo branch at commit `16385d4ab327b40c184e79904ba4e5cc3966e3f7`.
- 5 from #125 (feature/achievements-pixel-room-2026-11-12); 123 from #59 (integration/clean-pixel-themes); 2 from #92 (feature/tuner-metronome-polished-2026-11-08).
- Original PNG/SVG/JPEG/WebP bytes are retained by their original Git blob SHA. No recompression, retouching, or generated replacements.
- Images with identical blob SHAs already present in class-demo were omitted, as were repeated blobs across the source branches.
- Historical screenshots and design references under `web/docs/` were intentionally excluded: this directory catalogs **reusable art**, not UI mockups.

## Organization
- `visuals/new-assets/2026-11-07-sharp-pixel/`: approved isolated icons, cats, plant stages, visual accents, and practice-player icons.
- `visuals/pixel-motifs/`: music notes, botanicals, flourishes and related motifs.
- `visuals/cats/`: earlier approved cat pose variants; **do not overwrite current class-demo companion sprites**.
- `visuals/progress/`, `visuals/tracks-approved/`, `visuals/routines/`, `visuals/profile/`: page-specific decorative assets for optional reuse.
- `visuals/tools/pixel/`: uniquely preserved tool-floor decoration.
- `achievements/`: original `room-base.png`, `armchair.png`, and three SVG room-prop assets from #125. Current achievements-room art remains unchanged.

## Usage and review
This folder lives at `web/asset-library/pixel/`, deliberately **outside `web/public/` and `web/src/`** so these assets cannot silently replace currently approved UI or increase deployed public asset size. Copy only reviewed assets into `web/public/` or import them deliberately when implementing a screen.

See [SOURCE_MANIFEST.csv](./SOURCE_MANIFEST.csv) for every asset's exact original path, source PR/branch, blob SHA and size.

## Provenance
- PR #59, source commit `4626b2b04ccaea1a6184f1eebfbf365d2d4ced59`
- PR #125, source commit `b63d8d3d1a329ad4c3d5fc01cb07ecd714f95fb6`
- PR #92, source commit `ab6a0de43eb1955e04b6277cbfc239ddeead3593`
- PRs #90 and #94 reuse files already in #59; PR #93's routine header files match #59. PRs #89, #98, #108 and #78 provide no unique standalone runtime image files.

## Constraints
**No app feature changes. No theme import. No assets deleted from source branches.** This PR is an archival transfer only.
