# Class-demo recorded-track Practice Player

Updated November 11, 2026 on `class-demo-2026-10-31`.

## Implemented

- **Chart annotations:** red pencil in the player header opens a mobile sheet with measure selector, text entry, preview, save, edit and remove. Up to 12 characters appear as red inline text without modifying the source chart's original Tag/End/5× annotations. Longer notes show a red note-bubble marker in the measure and their complete text when that measure is selected. Notes are stored per account and per chart in localStorage.
- **Measure numbering:** a selectable Number measures control sits to the left of the red pencil. Tiny numbers appear in each box's upper-right corner, and the preference persists locally by account.
- **Session journal:** notebook at the right end of Finish Session opens a mobile sheet for the current entry and prior entries (including View all and delete). Entries are linked to the active session ID and chart, saved in localStorage by account. Completion notes reuse the journal text, and the actual finished duration updates the matching entry.
- **Metronome:** the player uses a compact, cream-and-green mobile settings sheet with On/Off, tempo, tap tempo, signature, beat accents and count-in. The Web Audio scheduler is owned by the practice session, not the modal, so sound keeps playing after closing the sheet. The quick On/Off button controls the same scheduler from the chart; session exit and finishing stop it.
- **Looping:** chart-provided A1/A2/B/C/Tag sections, Whole and user-added custom sections display inline count steppers. Choose 0×, 1× (default), up to 10×, then ∞. 0× skips a selected section; ∞ currently uses one million scheduled repeats, practically indefinite within a session. Counts apply to the existing chart and recording loop program. + Section opens a mobile sheet with label, start/end bars and live range preview.
- **Aesthetic:** all overlays use the class-demo warm cream/evergreen design with muted red chart-annotation accents. Existing chart, audio, ±10s seek, recording repeat, tuner, mixer preview, BPM/key/instrument, practice time and Finish Session remain.

## Known limitations and future improvements

- Notes and journal entries are **local to the browser/device**, not synchronized to Supabase or other devices. On a shared device, account-scoped keys separate logged-in users; anonymous sessions use the anonymous browser profile.
- Long-annotation bubbles are displayed in the chart and their full text appears below the chart on selecting that measure. They do not yet provide a separate popover directly inside a cell, because chord cells themselves are the existing seek controls.
- Custom sections and loop count edits are **session state**, not saved to the chart. The older advanced Loop Plan Settings dialog is retained when tapping the Loop heading.
- Recorded audio uses existing arrangements, with chart BPM/key as visual/reference controls only. Loop changes seek the recording to the selected range's start.
- The new in-player metronome shares its state within the Practice Player, while the standalone Metronome page still has its original screen and independent instance.
- The full test suite and an interactive mobile screenshot pass should be run before class presentation; the Vercel TypeScript/build check alone is insufficient for browser-verified behavior.
