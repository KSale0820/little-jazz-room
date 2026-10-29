# Cat companions — production specification

The **final approved** look is `APPROVED-VISUAL-REFERENCE.png` (Modern Jazz Companions). The eight selected cats and jazz roles are specified in `CAT-JAZZ-IDENTITIES.md` / `.json`. Production base sprites are `jazz-cat-assets/*.svg`; role props/accessories in the concept image are **visual specifications**, not validated animation assets. Cat chooser and optional stage-prop starter code is in `cat-starter-code/`.

| Cat | Coat | Age | Build | Jazz role | Signature |
|---|---|---|---|---|---|
| Luna | Calico | Adult | Medium | Piano | No accessory needed |
| Milo | Tuxedo | Adult | Slim | Tenor saxophone | Sunglasses |
| Maple | Ginger tabby | Young adult | Lean | Upright bass | Energetic expression |
| Mochi | Cream | Kitten | Tiny | Drums | Tiny drumsticks in stage scene |
| Pepper | Dark charcoal gray | Senior | Fluffy | Trumpet | Burgundy neckerchief |
| Patches | Gray and white | Adult | Chubby | Jazz guitar | Relaxed expression |
| Chai | Siamese | Adult | Slender | Vocals | Vintage microphone |
| Biscuit | Brown tabby | Adult | Large and round | Turntables/listening | Headphones |

## Production rules

- One anatomy-consistent cat per scene: one head, two ears, two eyes, four plausible paws, one connected tail. Instruments and clothing must not create false limbs. Some paws can be naturally hidden in a pose, not duplicated or bizarrely visible.
- The eight static SVGs passed tagged part-count checks; **visual anatomy and accessory positioning at actual phone size remain to be QA-tested**. Current sprites are simpler than the latest approved art; Cursor should improve fidelity without relying on AI-generated collage cutouts.
- **No old six-pose generated animations.** They FAILED manual anatomy audits. Safe Sunday animation: subtle 1–2px breathing/hover only on a static sprite, reduced-motion preference respected. Do not animate every thumbnail.
- Cat remains chosen via a Profile chooser; Home and Profile must use the **same selected cat**. Latest approved visual allows an OPTIONAL tiny companion card BELOW Practice controls, not on chart and hidden in Focus Mode.
- Cat selection persists per account through owner-only `profiles.selected_cat_id`; local storage cache keyed by user ID so user A's cat never flashes as user B's. The sample `useCatSelection` hook accepts `accountKey`, which must be the authenticated user ID.
- Home day/twilight/night scenery must be CAT-FREE with one transparent chosen sprite over it. Old bundled scene JPGs include a fixed cat and are reference-only. If a stage instrument is shown, place it as independent scenery or manually art-directed prop rather than simply gluing it to existing SVG paws.
- Roles are **character aesthetic**, not proof that the app can play or isolate the instruments. None of these cats needs to carry their instrument in every pose.

## Cursor acceptance

1. Select Milo, then Chai, then Pepper; all visible Home/Profile cat surfaces update correctly, including their name/instrument labels. Refresh and confirm persistence. Login as separate team user B and confirm A's cat cannot appear.
2. Check all eight at 48px/96px/256px and on phone 390px, each with one head/tail and plausible paw anatomy, readable facial features and correct distinctive age/build.
3. Test cat only appears once over a cat-free room in Sunshine/Twilight/Night. Invisible objects do not cover nav/buttons or chord reading.
4. Turn on reduced motion and cat motion toggle; confirm no unexpected movement. All eight cats are available free.

Older anatomy error reports live in `archive/`; DO NOT use the rejected images as production sprites.
