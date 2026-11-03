# Vocal tuning and pitch graph

The existing P04 instrument tuner now supports an optional **Voice** mode for
singers, humming and vocal exercises, in addition to Chromatic, Guitar and
Bass. The normal approved instrument gauge remains unchanged.

- **Voice mode** uses the same actual microphone pitch detection and displays
  a live eight-second pitch trajectory. Up means higher pitch, down means
  lower pitch, and breaks mean silence or sound without confident pitch.
- **Show pitch graph** reveals the trajectory in other tuner modes.
- **Spoken notes** was removed after iPhone testing because it was
  distracting and made tuning less predictable.
- A measured note is retained for at most 400 ms across a missed analysis
  frame; the graph only draws actual microphone measurements and breaks
  after sustained silence.
- The status occupies one fixed-height line to prevent the rest of the
  interface shifting, and all four mode labels fit at narrow phone widths.
- The graph is drawn from real analyser samples, not decorative or invented
  data. It does not save, upload or record the mic.

## Verification

The real Chromium `getUserMedia` test feeds a synthesized A440 wave through
the browser's microphone stack, verifies A4 detection, selects Voice, asserts
that the graph receives multiple actual samples and captures 390 × 844 and
375 × 667 screenshots. Unit tests cover pitch-to-chart transformations,
silent gaps and voice-mode note mapping. Live iPhone Safari voice output
and sustained input behavior still require physical-device checking.

## Vercel

This branch is based on `fix/web-tuner-iphone-safari-input` (PR #26), where
the iPhone microphone permission + Web Audio startup improvements were
implemented. Merge PR #26 first, then retarget/review this feature PR.
