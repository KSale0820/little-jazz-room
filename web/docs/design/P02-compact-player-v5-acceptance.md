# Practice Player visual acceptance — compact V5 (2026-11-10)

Visual source: `web/docs/design/P02-PRACTICE-PLAYER-APPROVED-REFERENCE.webp` and the most recently approved chart-first compact player mockup. Current implementation: `web/src/pages/PracticePlayerCompactV4.css` (scoped to `.practice-free`) plus the shared player and chart components.

Acceptance requirements, checked against the **real Autumn Leaves 35-measure chart**, not placeholder data:

1. Two or more chords within one measure appear side-by-side **horizontally**, with their original event order, beat metadata, and highlighting unaffected.
2. Increase chart, labels, and control typography. Do not enlarge the current chord measure rectangles or add vertical chart spacing. Preserve 4 columns and the same 35 real measures.
3. A/A/B/C/Tag section badge letters are **white** against the existing red badge fill, in Light and Dark themes.
4. Positioned annotations (Tag, End, 5×) remain visibly **inside** the relevant measure, not cut off by its top border or overwritten by chord text.
5. Back/forward 10s, Loop (text), and Repeat (distinct function) use *shorter buttons with larger text*. Maintain playback and loop operation.
6. BPM/Key/underlined Original reset remain one line in a shorter container, with functional up/down stepper buttons and original resets.
7. Metronome, Tuner, and Mixer labels are larger within shorter buttons. Keep Mixer disabled and labeled Preview until mixing actually exists.
8. Finish Session remains available above the bottom tab bar, with larger text in a shorter button alongside the time-practiced readout.
9. Maintain primary chart visibility: all 35 real bars should fit in the initial 390×844 screen; shorter phones may scroll the chart, but the transport and Finish Session must remain visible.
10. Check both 390×844 and 375×667 in Light and Dark, preserve the guided player independently, run browser QA, routine integration, and web build.

Automated geometry and typography assertions live in `web/scripts/check-clean-pixel-themes.mjs`. Any change to the approved layout should preserve action semantics and never substitute a static image for the functioning chart or controls.

PR #84 remains draft pending visual approval; do not merge or promote to production as part of this task.
