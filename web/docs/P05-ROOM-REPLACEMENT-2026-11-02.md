# P05 metronome room replacement (November 2, 2026)

## Source and required binary
The provided metronome room JPEG is 1199 × 1312. Its illustrated portion is resized proportionally to **1170 × 1280** and extended with 357 pixels of near-ivory wall **above** the artwork, producing an **exactly 1170 × 1637** pixel canvas. No rug, plant, or bookshelf is stretched nonuniformly.

Install the supplied **WebP** file on this branch at:

`web/public/visuals/tools/p05-metronome-room-2026-11-02.webp`

Expected SHA-256:

`65d614f02c7665c64e0a05557efe48a24f180780425700db634e4025c788213f`

This binary is **not yet committed**; GitHub's connected text/code writer cannot transfer container-stored image bytes. Do not claim P05 visual QA is complete or merge this branch until it is uploaded.

## Code changes
- P05 uses the new file first and falls back to the original `p05-metronome-background.png` if it cannot load.
- Only the P05 illustration is bottom-aligned and masked to blend with its ivory wall.
- Existing top vines are hidden when the new illustration loads, to avoid double botanical layers.
- The sitting cat remains a separate approved asset and is horizontally mirrored toward the central Play button. No artwork is repainted.
- P04 tuner and P02 shared Practice Player are unchanged.
- `check-class-demo-tools.mjs` validates exact image SHA-256, 1170 × 1637 browser intrinsic dimensions, metronome image source, and cat orientation at 390 × 844 and 375 × 667.

## Validation after binary upload
From `web/` run `npm ci`, `npm run build`, `npm test`, then start `npm run dev -- --host 127.0.0.1 --port 5174` and run `node scripts/check-class-demo-tools.mjs`. Compare the P05 captures at both phone sizes against approved UI/P/P05.png; inspect central Play button accessibility, cat orientation, bookshelf and floor/rug alignment.

Do not merge the umbrella PR #7 into master without explicit approval.
