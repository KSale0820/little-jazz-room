# Little Jazz Room: individual image assets (interim, QA honest)

## Install: follow this order
1. Back up your current work or make a git branch.
2. Copy the `web/` folder from this package into the repo root, merging folders.
3. Do NOT copy `ASSET-PREVIEW.jpg` to public.
4. Keep all application code and Supabase files unchanged; run the app and review Home + Profile.

## Exact runtime paths
- `web/public/room/home-hero-sunshine.png`, `home-hero-twilight.png`, `home-hero-night.png` are read by `JazzRoomScene.tsx`.
- `web/public/jazz-cat-assets/{id}-portrait.png` is used in the chooser and Home.
- `web/public/jazz-cat-assets/{id}.svg` is used for `CatSprite` with `variant=sprite`.
- `web/public/jazz-cat-assets/cats.json` is metadata; sync code metadata from this if needed.
- Individual `-icon.png`, `-small.png` files support avatar/icon placements; they are not auto-imported by current code.

## Honest limitations
- Character portraits use FACE/BUST detail from *individually generated* cat illustrations, not crops from the eight-cat concept collage. Some coat/accessory details are imperfect; they are provisional. The photos do not depict the assigned instruments reliably because source illustrations contained wrong instruments, and **must not be used as full-body/instrument-playing art**.
- Existing anatomically constrained `.svg` fallback sprites are kept for full-body. They are plain and do not yet match the concept illustration style. No full-body anatomical certification is claimed.
- Room images are resized from an **individual scene region** of a generated design sheet; they're cat-free but not source-native 1920x1080 art. Better separately generated high-resolution room images should replace these when available.
- Do not change names, traits, instruments, coat, age, or build; `cats.json` is authoritative.
- Do not use AI-cropped whole-screen reference boards as runtime backgrounds; do not show instrument mistakes.

## UI correction priorities from visual review
- Home currently displays flat geometry, floating character card, visible hotspot pills; replace the hero scene, remove visible hotspot labels except on focus/hover, position cat at floor without a framed rectangle.
- Profile art is a mixed gallery of different treatments; use one portrait source per cat.
- Explore/Create/Practice read as generic forms; add restrained botanical scene treatments, serif headings, consistent small tokens, spacious but compact cards.
- Desktop navigation reads as an oversized horizontal vertical stack and app remains too narrow; cap content width sanely while retaining a real sidebar.
- Preserve RLS, login, Supabase, session and routine functionality.
