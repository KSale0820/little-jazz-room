# Recorded backing tracks: phase 1 (no stems required)

**Owner:** Product & Integration. **Scope:** stereo recording playback infrastructure only. No remix, uploads UI, Supabase, key/tempo DSP, stem isolation, or design changes.

## When the first tracks arrive

1. Use a recording you own or are licensed to use inside the app. Keep a clear rights note for each file.
2. Put the audio in `web/public/audio/backing-tracks/`. Prefer MP3 for broad mobile support; AAC/M4A or WAV also work. Keep original audio files out of commits until usage rights and repo-size are confirmed. This is a **public** Vite asset location: do not place private or restricted recordings here.
3. Add metadata to `web/src/features/recordings/recordingCatalog.ts`: unique `id`, descriptive title/subtitle, linked **existing** `chartId`, `src` path, original `recordedBpm`, and `chartStartSeconds` (seconds until the actual first chart beat, including any pickup/count-in). Supply the remaining track filters and `rightsNote`. Do not create fake chart IDs. An empty catalog is the intentional default.
4. Verify the song's structure against its chord chart. BPM is in **quarter notes per minute**; 6/8 chord events use eighth-note beat units. A single tempo/offset assumes a fixed-speed performance. Human tempo variation or rubato will require per-bar/beat sync markers in a subsequent phase.
5. Test on Safari iPhone, desktop Chromium, and the two approved CSS viewport sizes. Confirm play/pause, scrub, restart, no autoplay, no leaked audio after navigation, and session completion. A file that fails to load must display an error, not silently fall back to chart-only playback.

## Important constraints

- One ordinary stereo file per track is sufficient. Playback runs at its **original** pitch and tempo. The existing chart reference transposition/tempo controls are NOT DSP controls for the recorded audio.
- Do not loop/trim a recording by repeating an arbitrary section of the visual chart; this foundation repeats visual chart measures over recording time only.
- Do not route production backing audio through the synthetic-tone `native-audio/stemTransport.ts` feasibility lab.
- The existing shared P02 UI and Practice-first navigation are authoritative. Do not replace it with a new audio screen.
- Do not merge this branch into the demo or `master` until CI and the first actual recording on a device are accepted.
