# Approved pixel companions — November 6, 2026

The user directly supplied the six PNG artworks shown below. These are the authoritative original images, not drafts or generated fallback variants.

| Companion | Sitting original | Sleeping original |
| --- | --- | --- |
| Milo, charcoal/dark with cream bib | `web/public/visuals/cats/clean-pixel/milo-sitting.png` | `web/public/visuals/cats/clean-pixel/milo-sleeping.png` |
| Maple, orange and cream | `web/public/visuals/cats/clean-pixel/maple-sitting.png` | `web/public/visuals/cats/clean-pixel/maple-sleeping.png` |
| Luna, light lavender gray and cream | `web/public/visuals/cats/clean-pixel/luna-sitting.png` | `web/public/visuals/cats/clean-pixel/luna-sleeping.png` |

All six are original **1254 × 1254 transparent RGBA PNGs**. They replace the prior 160px placeholders in-place, with no changes to paths, companion selection, pose switching, Cat Mode, stored data, or screen geometry. The test `web/src/assets/cleanPixelAssets.test.ts` locks their original SHA-256 hashes against accidental substitution.

Current runtime source: `VISUAL_ASSETS.decorativePixelCats` → `VERIFIED_PIXEL_CATS`. `CatSprite` and `DecorativeCat` already consume those paths on Profile/chooser, Progress, Tuner, Metronome and reachable Home views. The prior documentation claiming Luna must be re-created as a black/orange calico is **superseded** by these new owner-supplied images.

Separate approved design direction: the user's 'Little Jazz Room - Clean Pixel Motifs' moodboard. Use saturated, deliberately placed botanical and music-note pixel accents, lavender/plum dark surfaces, warm light surfaces, crisp outlined icons, and modest tactile borders. The moodboard is a visual direction reference; it does not authorize reintroducing full room illustrations or moving chart/transport controls.

Do not resize, recolor, redraw or regenerate these six source PNGs when future changes request visual tuning. Create separate web-optimized derivatives only when the original source files stay preserved and the owner approves the resulting display.
