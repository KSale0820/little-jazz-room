# Visual Fidelity Review — Home Page
_Rebuilt Oct 28 2026 · Compare against `APPROVED-VISUAL-REFERENCE.png`_

## What now matches ✅

| Element | Status |
|---------|--------|
| Bright illustrated botanical jazz room (piano, plants, bookshelves, city window) | ✅ `home-hero-sunshine.png` displayed correctly |
| Cat-free room art — no baked-in cat crops | ✅ Hero PNGs are cat-free |
| Illustrated, naturally-proportioned cat on floor (not pixel/blocky sprite) | ✅ `luna.png` full-body illustrated PNG |
| Cat positioned in lower-left at floor level, in front of piano | ✅ `left: 8%; bottom: 0` |
| Hotspot labels invisible at rest; appear only on hover/focus | ✅ CSS `opacity: 0`, visible on `:hover`/`:focus-visible` |
| Time-of-day room lighting (sunshine/twilight/night), Auto default | ✅ `resolveLighting()` + manual override |
| `home-hero-sunshine.png` forced for screenshot captures (not dark night render) | ✅ localStorage pre-seeded in script |
| "My Jazz Room" serif title + time greeting in legible overlay | ✅ Frosted-glass pill at top-left |
| Personalised greeting when signed in ("Good morning, Kat.") | ✅ `displayNameFromUser()` from Supabase user |
| Daily goal progress bar + streak + note count | ✅ |
| Start Practicing CTA (full-width sage green) | ✅ |
| Today's Practice card | ✅ |
| Quick Access card (Saved Routines / My Exercises / Explore) | ✅ |
| Long-term goal bar | ✅ |
| Bottom navigation (Home / Explore / Create / Practice / Profile) | ✅ |
| Desktop sidebar layout | ✅ |
| Supabase / RLS / routine / exercise logic unchanged | ✅ |

## Remaining mismatches vs reference 🔶

| # | Element | Gap | Severity |
|---|---------|-----|----------|
| 1 | **Greeting text style** | Reference overlays "My Jazz Room" + name directly on art without a pill/card. Current uses a frosted-glass pill for legibility over varied room tones. | Low |
| 2 | **Cat size** | Reference cat is slightly larger relative to room height (≈35% of hero height). Current is ≈28%. Safe to increase once approved. | Low |
| 3 | **Cat click affordance** | Reference shows cat with no visible frame. Current: subtle drop-shadow + hover scale. | Very low |
| 4 | **"Sign in" button placement** | Reference has no sign-in button on Home (authenticated state assumed). Our app correctly shows it for unauthenticated visitors. | By design |
| 5 | **Room PNG resolution** | Hero PNGs are resized scene crops (not native 1920×1080 generated art). Visible at larger desktop breakpoints. | Medium |
| 6 | **Twilight/night room variants** | Twilight and night PNGs exist but screenshots always forced to sunshine. The CSS filter approach for twilight/night is functional but not perfectly colour-matched to the reference palette. | Low |
| 7 | **Explore / Practice / Create / Profile screens** | Not redesigned yet (per instruction: stop until Home is approved). | Deferred |

## Screenshots (Oct 28 2026 rebuild)

- `web/docs/screenshots/current-app/mobile/01-home.png` — 390×844, sunshine mode
- `web/docs/screenshots/current-app/desktop/01-home.png` — 1280×900, sunshine mode

## Phase 3 status

**Not started.** Sharing, tokens, remix features are deferred.
