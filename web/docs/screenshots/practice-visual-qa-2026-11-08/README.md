# Practice Hub visual QA — November 8, 2026

Captured from the working React app at source commit `38255c2352ec8603ca34797d84192c0fa53dda25` using mobile Chromium/Playwright, with Cat Mode **on** and both saved Light/Dark preferences. Approved design reference: [Practice UI](../../ui-reference/approved-practice-home-2026-11-08.webp).

| Screen | Light | Dark |
| --- | --- | --- |
| 390 × 844 | [Screenshot](./light-390x844.webp) | [Screenshot](./dark-390x844.webp) |
| 375 × 667 | [Screenshot](./light-375x667.webp) | [Screenshot](./dark-375x667.webp) |

## Corrections verified
- **Sleeping companion:** Enlarged using a controlled sprite scale; no overlap with the streak pill or the primary practice card at either viewport.
- **Free Practice artwork:** Gold saxophone and lilac notes are placed within the card's boundaries, not floating above the card.
- **Dark theme:** Wordmark/banner has dark treatment and usable contrast. Headline, stat pill, track/routine cards, pin row, quick tools, goal controls and navigation are readable.
- **Assets:** All sampled images decode. No runtime page errors in four Chromium passes.
- **Compact height:** On a 375 × 667 screen, the Practice content scrolls inside `.viewport`. The bottom goal panel is reachable by scrolling approximately 27 CSS pixels; the pinned navigation remains fixed.
- **Functionality:** No changes were made to audio, playback, session logging, chart editing or routing in this visual QA correction.

Screenshots are evidence for *this source commit*; regenerate them after subsequent visual changes. This PR remains a draft until owner approval.