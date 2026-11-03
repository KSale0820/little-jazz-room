# Vocal tuning and pitch graph

The existing P04 instrument tuner now supports an optional **Voice** mode for
singers, humming and vocal exercises, in addition to Chromatic, Guitar and
Bass. The normal approved instrument gauge remains unchanged.

- **Voice mode** uses the same actual microphone pitch detection and displays
  a live eight-second pitch trajectory. Up means higher pitch, down means
  lower pitch, and breaks mean silence or sound without confident pitch.
- **Show pitch graph** reveals the trajectory in other tuner modes.
- **Spoken notes** is optional, off by default, and available in Voice mode
  when the browser supports SpeechSynthesis. It announces only a sustained,
  detected note after ~850 ms, throttled to avoid constant announcements.
  Use headphones to prevent the spoken output being captured by the mic.
- The graph is drawn from real analyser samples, not decorative or invented
  data. It does not save, upload or record the mic.

## Verification

The real Chromium `getUserMedia` test feeds a synthesized A440 wave through
the browser's microphone stack, verifies A4 detection, selects Voice, asserts
that the graph receives multiple actual samples and captures 390 × 844 and
375 × 667 screenshots. Unit tests cover pitch-to-chart transformations,
silent gaps and voice-mode note mapping. Live iPhone Safari voice output
and audio behavior still require physical-device checking.

## Vercel

This branch is based on `fix/web-tuner-iphone-safari-input` (PR #26), where
the iPhone microphone permission + Web Audio startup improvements were
implemented. Merge PR #26 first, then retarget/review this feature PR.
