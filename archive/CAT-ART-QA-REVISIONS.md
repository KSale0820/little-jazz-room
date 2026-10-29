# Jazz Cats — targeted visual corrections (October 28, 2026)

The user approved the current eight-cat roster and general layout, but requested anatomy-focused corrections in **two concept boards**. The updated mockups are `reference-only/revised-cat-board-1.png` and `reference-only/revised-cat-board-2.png` (visual references only).

## Board 1: header and animation poses

- **Milo + saxophone:** the saxophone must be one recognizable, intact saxophone, with an attached neck and mouthpiece, one bell, one body, and plausible keywork. Do not attach the instrument to the cat's anatomy or generate a second mouthpiece. A cat may sit beside a saxophone rather than physically play it; visual clarity is more important than novelty.
- **Patches:** adult chubby gray-and-white body, one head, two ears, two eyes, four limbs/paws total, one tail. When lying on the back, explicitly pose the four paws rather than synthesizing extra feet; tail must attach at the hip and not arise from the chest or neck.
- **Stretch:** back legs remain in one continuous pelvis/body, exactly two front legs extend to the floor, one tail emerging from the rump, ears attached to one head. Avoid extra overlapping/ghost paws.
- **Play:** a single lifted paw touching one ball/toy; remaining limbs connect to the same torso. No duplicate head, floating paw, disconnected tail or extra feet.
- **Lie down / sleep:** a consistent cat silhouette with believable tucked/visible paws, one head and one tail; no duplicated faces or multiple rump shapes. Eyes closed naturally when asleep.

## Board 2: screen art and footer

- **Explore — Milo's eyes:** exactly two coherent eyes, aligned on the same face and looking in a consistent direction; keep the black tuxedo coat and slim proportions.
- **Practice room cat:** visually plausible torso, neck, head and four paws; one tail attached to the rump, no extra limbs, especially near bedding/rugs. Cat is optional scenery there but must not cover chord notation or player controls.
- **Footer / companion lineup:** review **Milo** (slender upright black cat, legs/feet distinct, tail behind body) and **Maple** (lean ginger tabby, one head, one tail, four paws, no doubled limbs). They must match their chooser sprites rather than introducing new character geometry.

## Implementation priority and verification

**Use `jazz-cat-assets/*.svg` as canonical production sprites.** AI-generated illustrative mockups can still depict ambiguous overlapping paws, so do not auto-extract them as game assets. For React UI, use sprite overlays on cat-free backgrounds, with a single selected cat ID shared by Home and Profile. Practice / Explore concept board artwork is optional ambiance, **not** a reason to add cats to functional controls.

For actual animations, prefer authored per-pose SVG or PNG assets derived from the same base body/coat mapping; do not use generative interpolation to change anatomy. CSS breathing, 1–2px bobbing, blinking, and whole-sprite sliding are safe for Sunday. If pose art fails visual QA at 48px and 128px, do not ship the pose; retain idle animation instead. Check reduced motion.

### Cursor acceptance checklist

- [ ] Review boards at full resolution and close-up: Milo's sax (one bell, joined neck), Patches' paws/tail, and facial proportions.
- [ ] Review `idle`, `stretch`, `play`, `lie down`, and `sleep` frames for one head, two ears, four paws, one attached tail and two eyes (or closed-eye lines).
- [ ] Check Milo eyes on Explore and body anatomy for the Practice-room illustration.
- [ ] Check Milo and Maple foot/tail attachments in the footer at actual phone size.
- [ ] Use canonical sprites for real app selection; do not reuse malformed generated cats or bake a fixed cat into the room background.
- [ ] Compare all cat instances after selection; the selected companion must be visually consistent across Home/Profile.

## Second audit finding: previous generated pose sheet FAILS

**Read `CAT-ANATOMY-AUDIT-ROUND2.md` before using any pose art.** The latest board still shows incomplete/mislabeled Look and Stretch across seven of eight cats and unverified overlapping paws on Practice Patches. The six pose sequences are **NOT approved**. The eight canonical SVGs are static idle art; CSS bobbing is approved in principle pending small-screen browser inspection. Do not tell the user all six poses passed anatomy checks.
