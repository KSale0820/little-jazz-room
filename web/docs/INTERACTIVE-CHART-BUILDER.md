# Interactive Chart Builder integration contract

Branch: `feature/interactive-chart-builder` (based on `class-demo-2026-10-31`).

## Available now

- `/my-charts`: My Charts, local edits, duplication and guarded deletion; built-in charts remain read-only.
- `/charts/new`: blank four-measure chart editor.
- `/charts/:chartId/edit`: edit a custom chart; seeded charts are read-only and may be duplicated.
- `web/src/features/charts/chartModel.ts`: chord parser, time-signature validation, split/merge, beat edits and transposition.
- `web/src/features/charts/chartRepository.ts`: `createChartRepository(scope)`, `newLocalChartId()`, `getChartById(id, charts)`, `mergeCharts(...)`.
- `useApp().charts` now contains seeded and current-account local charts. Call `useApp().refreshLocal()` after writes.
- Stable IDs look like `chart-local-<UUID>`. Chord events use **one-based denominator-note beats** and `duration_beats`, e.g., `6/8` means 6 eighth-note units per bar. BPM is defined in quarter notes; use `chartEventDurationMs(event.duration_beats, { numerator, denominator }, bpm)` to obtain precise clock durations. Compound grouping is not inferred from meter.
- `parseChartMeter` accepts numerators 1–12 over denominators 2, 4, or 8 (including 5/4, 6/8, 7/8, 9/8, 12/8). The editor saves the full `Chart.time_signature` tuple. Agent 1 must update timing and accent grouping before claiming support in Player.
- `DraftBar.section` marks a section start; unlabeled bars continue until the next marker. `draftSections` and `duplicateDraftSection` allow A–B–A by appending independent copied measures. Saved `ChartBar.section` remains compatible with seeded data.
- `ChartBar.annotation?: string` and `Chart.style_instruction?: string` are display-only, not chord events.
- Local storage namespace is `little-jazz-room:charts:v1:<account scope>`. It uses `localStorageScopeForUser(user?.id)` through `useApp().repo.scope`.
- Deletion checks linked exercises and routine step snapshots. Other future references should be supplied to `deleteChart` before enabling deletion.

## Agent 1 — Shared Practice Player (after your branch merges)

**Do not modify PracticePage.tsx in this branch while Agent 1 is working.**

Replace static `chartsById[...]` access with a lookup over `useApp().charts` (or `getChartById(id, charts)`). Keep seeded chart fallbacks for historical practice links. Display `bar.annotation` in muted red above its measure and `chart.style_instruction` near the title. The timing model must advance at each event's `beat` and respect `duration_beats`, including two or more events in a bar and 2/4, 3/4, 4/4.

Existing Player entry URL: `/player?chart=<stable-chart-id>`. The library deliberately does not offer that action for custom charts until your update is merged; seeded-chart practice remains accessible.

## Agent 2 — Routine Builder (after your branch merges)

**Do not modify CreatePage.tsx in this branch while Agent 2 is working.**

Primary action: navigate to `/charts/new?returnTo=%2Fcreate`. Preserve unsaved routine and exercise fields **before** navigating (including partial new exercise fields, not just the old `CreateDraft` summary). On Save, the Chart Builder returns to `/create?createdChartId=<stable-chart-id>`. Read `createdChartId` and populate the active exercise's `chart_id` automatically. The entire Chart object can be found in `useApp().charts` after `refreshLocal()`. Display its title and an Edit Chart link to `/charts/:chartId/edit?returnTo=%2Fcreate`. Existing Chart selection should use a searchable picker over `useApp().charts` rather than a long select.

Saved local charts are private to the current local account. Cloud publishing, external sharing, audio upload and mobile backing-track playback are outside this change.

## Notes for visual approval

Run `npm run build` and `npm test` from `web/`. Screenshot flows are in `web/scripts/check-interactive-chart-builder.mjs` and the dedicated GitHub Actions workflow. Preserve the approved Practice P02 layout when completing integration.
