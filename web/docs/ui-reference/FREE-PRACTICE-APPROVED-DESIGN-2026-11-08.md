# Free Practice — approved November 8 UI

**Design authority:** The owner-approved Free Practice image mockup in the November 8 ChatGPT project conversation. Do not substitute older Free Practice mockups or the chart-based Practice Player. Exact visual alignment takes precedence over previous PR #90 styling, while live app behavior and state are authoritative for persistence and audio.

## Approved screens

1. **Intro:** Practice title and Free Practice / Routines segmented navigation, centered pixel stopwatch, concise description, green **Start Practice** CTA, sparse pixel plant and optional selected sleeping companion at the bottom.
2. **Setup:** Time target with working −/+ five-minute controls (25-minute default; 5–240 range). Five optional rows: Goal, Exercise, Chart, Routine, Backing Track. Selection results, custom goal, techniques, actual charts/routines and recordings remain functional.
3. **Active:** Large circular elapsed-time ring with visual target progress, selected-session summary, visible **Pause** and **Finish Session** buttons. A time target is not a countdown or automatic stopping rule.
4. **Paused:** Same layout with clear paused state and working **Resume**.
5. **Completion:** Time and actual activity summary, selected companion decoration if Cat Mode is ON, real saved/saving/failure indicators, View Saved Session / Practice Again actions.

Light mode: warm ivory, forest green, understated lilac and gold. Dark mode: current charcoal foundation and semantic theme colors. Match the app’s established four-tab navigation. Cat Mode OFF removes only scene cats. No extra page is needed to configure appearance.

## Functional safeguards

- Timer uses the existing elapsed-time clock and remains independent of native audio playback. Target adjustments are presentational only.
- Existing saved-session data, optional local activity feedback, retry-save behavior, duplicate-save protection, existing chart grid, registered audio and tuner/metronome overlays are retained.
- **Auto-saving on Finish Session remains authoritative**. The mockup’s Save Session / Discard actions are illustrative; adding an explicit discard before save would change working persistence and risks dropping completed practice.
- Do not add recordings, audio synthesis, fabricated achievements, new cats, animations or unrelated screens.

## Screenshot evidence

`web/scripts/check-free-practice.mjs` runs both 390×844 and 375×667 with Light/Dark and Cat Mode ON/OFF and captures intro, setup, exercise/chart/routine/track choices, selected activities, running, paused and saved states. The GitHub Actions `Clean pixel theme integration QA` workflow uploads the resulting images under `web/docs/screenshots/free-practice/`. Screenshots are generated from the live app for review, not baked into the runtime.
