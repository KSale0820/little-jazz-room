# Class-demo recorded-track Practice Player: follow-up functionality

Status: UI-only design pass, November 11, 2026, branch `class-demo-2026-10-31`.

## Implement later, not in this visual pass

1. **Chart notes:** The small red pencil above the chart should open a chart-specific notes editor. Decide whether annotations are chart-level, per-measure, or both; persist and reload them safely. The current button displays a truthful coming-soon notice.
2. **Session journal:** The notebook button attached to Finish Session should open an in-session notes editor. Persist a draft throughout the session and associate it with the saved session. Existing optional notes on the completion screen continue to work. The current notebook button displays a coming-soon notice.
3. **Persistent metronome + quick toggle:** Move the metronome audio engine/state outside the Metronome tool page so it continues during chart practice, while navigating between the tool and the player. Start/stop from a small On/Off control in the player without losing BPM, time-signature, accent or count-in configuration. The current Off control opens the existing Metronome tool; it does **not** start audio on its own.
4. **Direct per-section loop editing:** Make each inline section counter an interactive stepper with choices **0×, 1× (default), 2× … 10×, ∞**. Define 0× as skipping that section and ∞ as continuous looping. Ensure it remains consistent with the existing recorded-audio seek and chart-only clocks, and with the independent repeat transport control.
5. **Section adder:** Replace the interim use of the existing Loop Plan Settings dialog with a dedicated compact **+ Section** chooser for selecting custom bar ranges. Support editing/removing/reordering entries if approved. Keep the existing detailed editor available until parity is verified.

## Current visual-pass behavior and invariants

- The player layout is updated only for **recorded tracks with synchronized chord charts**. Chart-only, guided-routine, recording-only and independent Free Practice flows retain their existing layouts and controls.
- Existing playback, seek ±10 seconds, repeat recording, key transposition, instrument transposition, reference BPM, Original BPM reset, loop-plan modal, timer and Finish Session workflows remain active.
- Inline loop counters visually show a 1× default or the currently configured section count. Clicking one, or + Section, opens the **existing** Loop Plan Settings dialog. There is no new direct repeat logic.
- Mixer remains disabled and labeled Preview.
- Reference BPM and chart key do not modify recorded audio speed or pitch.
- Do not silently invent persistence, audio capabilities, or note storage to satisfy a visual mockup.

## Validation checklist for later feature work

- Mobile viewport widths 375 and 390: no clipping of controls, chord cells, or two-row loop options; Finish and journal buttons have distinct accessible targets.
- Confirm test coverage for section repeat 0× / 1× / 10× / ∞ and custom section range validation, both chart-only and recorded-track modes.
- Metronome survives tool closing, navigation and display lock safely; a single audio scheduler controls both views, without double audio.
- Journal and chart annotations survive reload and are scoped to the correct chart and account/session; do not duplicate saves.
