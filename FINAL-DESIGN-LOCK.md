# FINAL DESIGN LOCK — October 28, 2026

## APPROVED SOURCE OF TRUTH

`APPROVED-VISUAL-REFERENCE.png` is the **latest explicitly approved concept** (Concept G / Modern Jazz Companions, final anatomy-refined artwork). It **supersedes all previous collage images**. Reproduce its aesthetic and overall five-screen composition, not its tiny literal text or illustrative chord symbols. Previous concept boards are *reference-only*, never production characters or app UI screenshots. **Do not ask user to choose a design again.**

## Visual design

- Overall: clean, restrained, light, airy ivory background with soft sage-green actions, muted peach/brass touches, and deep evergreen headings. Clear, legible text and uncluttered margins. Detailed pixel-art scenery and companions without a corporate dashboard feel.
- Keep original five-tab structure: **Home, Explore, Create, Practice, Profile**. Phone bottom navigation uses **pixel-style icons**; desktop may use sidebar. **No icons in exercise list items or Browse by Category tiles**.
- **Home:** a LARGE illustrated jazz room with interactive piano, music stand, and notebook/shelf objects (visible labeled controls as accessible alternatives); piano/upright bass/sax/trumpet/guitar/drums/record player/plants in background. Cat from selected transparent sprite only. Beneath: daily goal + gentle streak, prominent Start Practicing, Today's Practice, Quick Access (Saved Routines / My Exercises / Explore), and long-term goal. Keep a friendly natural visual hierarchy, not many competing cards.
- **Home time of day:** Sunshine 06:00–17:00, Twilight 17:00–20:00, Night 20:00–06:00 based on the browser's local clock, with Auto and manual modes; only room illumination/art palette changes. **The light application UI does not turn dark at night.** All three scenes must depict the SAME room and no baked-in cat; old JPGs are reference-only.
- **Explore:** search, instrument/difficulty filters; Routines / Exercises tabs; text-only skill categories and exercise rows. Category cards have no decorative icons. Optional preview for Challenges and Friends, not mandatory backend.
- **Create:** concise title, goal, level, instruments, ordered text-only exercises, edit/save/publish; accessible reordering controls, draft and visibility. No cats or clutter inside editing form.
- **Practice:** light ivory sheet-like **jazz chord GRID** (measures, section labels, repeats, 2 bars per row on narrow phones/4 where legible), NOT guitar fret charts. Chords / Player switch, optionally Scales only when actual content. Real chart data takes precedence over illustrative symbols in collage. Large Start/Pause, loop and tempo, metronome and clear no-recording mode. The newest approved mockup shows a **small decorative cat in a separate bottom panel**: permit this *optional* companionship panel BELOW the chart/controls, but it must disappear in Focus Mode and never overlap music. No cat animations over the notation. Cat on Home and Profile is mandatory.
- **Profile:** stats, practice calendar, saved/created/published routines, long-term goals, achievements (simple or preview), chosen cat and eight-cat chooser. Friendly, non-punitive feedback.
- **Motion:** restrained 1–2 px breathing/blink or bob from verified base sprites. Respect reduced motion, no sounds autoplay. The prior six-pose generated sheets FAILED anatomy checks and remain disallowed.

## Eight cats are jazz musicians — a consistent identity system

Role and props are in `CAT-JAZZ-IDENTITIES.json` and `CAT-JAZZ-IDENTITIES.md`:
Luna (piano), Milo (tenor sax + **sunglasses**), Maple (upright bass), Mochi (drums), Pepper (trumpet + **burgundy neckerchief**), Patches (jazz guitar), Chai (vocals + microphone), Biscuit (turntables + **headphones**). Retain varied ages/builds/coats and the visibly different facial expressions, not uniformly bored cats. Do not add sunglasses to every cat or overdress them. Optional props should be drawn as an **independent scene layer** or hand-checked integrated artwork, not automatically pasted over an arbitrary SVG limb. A cat can be shown without its instrument in its idle/chooser/goal art; musical affiliation remains the same.

**Anatomy gate:** one head, two ears, two eyes, four anatomically plausible paws, one attached tail. A limb may be occluded by an instrument, NEVER duplicated. Check at 48, 96 and 256px; no stray heads, tails, limbs, dangling instruments, distorted saxophones or floating guitar necks. Use `jazz-cat-assets/*.svg` as functional selectable sprites; the approved collage conveys *desired style*, not a verified spritesheet. Upgrade a sprite for style only with an anatomy review. No new AI-rendered multi-pose sheet required for launch.

## Conflict resolution (explicit)

- Latest approved visual reference supersedes the older dark Practice design: **Practice remains light**.
- Latest approved illustration supports a **small optional Practice companion illustration** despite the original Home/Profile-only direction; keep the main playing/notation area cat-free and provide Focus Mode.
- Cat instruments are **character identities**, not evidence that the app supports recorded playable stems; audio architecture remains recording-first and empty by default.
- Chart titles in illustrative mockups are not licensed real lead sheets. Use validated original harmony studies from `jazz-seed-content.json`.
- Avoid faux functional UI. Preview-only features clearly say Preview / Coming later.
