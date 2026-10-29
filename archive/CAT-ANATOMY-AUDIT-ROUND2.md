# Jazz Cats: second visual anatomy audit — 2026-10-28

**Decision: FAIL — generated animation board is NOT approved as production pose artwork.** It remains an art-direction reference. This review is of `reference-only/reference-only-animation-board-unapproved.png`, not the canonical eight transparent static SVGs. Visual ambiguity is explicitly recorded rather than claimed as resolved.

## Repeatable pose acceptance

Each cat must have six *distinct* frames, labeled with matching movement: `idle`, `look`, `stretch`, `play`, `lie_down`, `sleep`. Do not reuse a stretch image as look or a crouch as lie down. The head should rotate to a side without changing posture in Look. Stretch requires front paws extended on ground, chest lowered, pelvis raised and rear paws planted. Play needs a connected paw interacting with one visible toy or a visibly playful posture. Lie Down is relaxed belly-down with chest and hindquarters low and paws tucked/forward. Sleep retains the same plausible lying body but with closed eyes and minimal motion. All states require one torso, one attached head, two ears, two eyes or closed-eye lines, at most four anatomically connected legs/paws, exactly one connected tail, no floating head/tail/foot, no extra face, and no intersecting contradictory silhouettes. Visibility of all four paws is NOT required when hidden by body; no extra paw may be visible.

This is a visual/manual test in addition to any SVG tag-count test. A structurally correct SVG can still have unnatural pose geometry; invisible/occluded limbs may still exist logically. Check each render at 48, 96, and 256 px.

## Cat-by-cat audit of most recent generated board

| Cat | Main portrait | Animation defects | Action |
|---|---|---|---|
| Luna | No definite duplicate appendage visible | Most distinct top poses; Play/Lie Down overlapping paw outlines need close review | Keep base idle; recheck Play and Lie Down |
| Milo | No clear duplicate head/tail; eyes appear consistent | Only two images under Idle/Look/Stretch; middle pose is a body crouch, not head turn; dedicated Stretch absent; bottom Lie Down shows raised tail/hindquarters | Author Look and Stretch separately; replace Lie Down |
| Maple | One head/tail in main image | Only two images under three top labels; middle looks like a crouch/stretch, not look; resting frames insufficiently differentiated | Create true Look and Stretch; distinguish Lie Down and Sleep |
| Mochi | One face, two ears in main image | Look is already a low lying body; dedicated Stretch absent; Lie Down/Sleep near duplicate | New Look and Stretch; make sleepy state visually distinct |
| Pepper | Portrait largely coherent | Look is a low crouch, no distinct Stretch; Play shows no obvious toy/action; leg overlap in crouch | Separate head-turn and stretch poses; rework Play |
| Patches | Main portrait now appears to have one head (previous double-head improved), tail attachment not fully visible | Look and Stretch share a single image; Play/Lie Down/Sleep have very similar belly-down silhouettes; some paw overlaps cannot be confidently resolved | Redraw/stretch and ensure four-or-fewer connected limbs, differentiate actions |
| Chai | Portrait mostly coherent | Only two upper images; middle shows crouching not head turn; Stretch missing; Play lacks obvious action | Add head-turn Look and grounded Stretch; add toy/action in Play |
| Biscuit | Main portrait coherent but in sleep/loaf pose | Idle looks asleep; Look missing; Stretch represented by a suspicious isolated partial cat on the right; Play not clearly play, Lie Down and Sleep very similar | Replace Idle, Look, Stretch; redo Play; loaf Lie Down with eyes open, Sleep closed |

## Screen-specific visual review

- Home Luna: one head and one tail; forepaws overlap with cushion and need close check before using as separate artwork.
- Explore Milo: eye count and placement appear consistent; instrument is environmental and not required in cat animations. Use selected cat overlay in production, not baked-in scenes.
- Practice Patches: head count appears one, but overlapping back/forepaws and bedding obscure limb topology; **FAIL** until redrawn or replaced with verified canonical sprite. Chord grid must remain cat-free.
- Create Chai: portrait silhouette plausible, but production Create need not show a fixed cat.
- Profile Biscuit: one head, coherent resting posture; replace with selected avatar to ensure companion matches user selection.
- Footer cat icons: use derived canonical sprites at one scale, not separately generated inconsistent miniatures.

## Source-of-truth policy

- Canonical `jazz-cat-assets/*.svg` is an **idle/static** base, not six approved animations. Its tagged counts (1 head, 2 ears, 4 SVG paw objects, 1 tail, 2 eyes) are mechanically verifiable; they are not proof of all pose states or of every scenic illustration.
- `jazz-cat-assets/cats.json` holds roster metadata. `cat-starter-code/` supports gentle whole-sprite CSS bobbing/breathing, which changes position only and cannot create new anatomy.
- For Sunday MVP, use these static SVGs with restrained whole-sprite motion (and optional nonmorphing blink if author-reviewed). Display the selected cat on Home and Profile; do not ship unverified six-pose artwork. Later six-pose sprite sets are a stretch goal with a manual per-pose acceptance gate.
- Do not add animals to the reading/chart area in Practice. If showing an animal in the room at top, use one verified selected-cat sprite over cat-free background.

## Cursor acceptance gate

1. Load eight canonical base sprites and confirm stable one-cat selection in Home/Profile.
2. At mobile 390px and full desktop, inspect all eight at 48px and 128px. No duplicated or detached anatomy, no face misalignment.
3. Confirm one cat total after swapping selection, including nighttime/twilight/sunshine rooms.
4. For each new six-pose sequence, first verify there are *six rendered images*, each with correct name and pose, not six labels under five images.
5. For each rendered pose: count head, ears, eyes (or closed lines), tail; visually trace every leg back to torso. Do not reject normal occlusion of hidden legs, but reject extraneous visible paws.
6. Distinguish Play / Lie Down / Sleep through visible behavior: paw-toy interaction, awake loaf, closed-eye resting curl.
7. Verify transition frames, not just endpoints: no detached or duplicated tails/paws or body morph glitches.
8. Honor `prefers-reduced-motion` and user motion toggle.
9. If any pose fails, fall back to static idle. Never report it as approved until manual screenshot inspection passes.
