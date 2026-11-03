# Recorded backing tracks: stereo audio without stems

## First track: Autumn Leaves

The project owner supplied an MP4 and confirmed that it is their video. Only the **AAC stereo audio** is used; there is no video component.

- **Track title:** Autumn Leaves
- **ID:** `autumn-leaves`
- **Audio asset path:** `web/public/audio/backing-tracks/autumn-leaves.m4a`
- **Duration:** approximately 4:06
- **Format:** AAC audio in an M4A container, stereo, 44.1 kHz, about 128 kb/s
- **Status:** Metadata and audio-only UI prepared. The M4A binary is **not yet present in GitHub**; the Tracks card stays disabled and marked Audio pending until the asset exists.

The audio file was supplied separately in this conversation. To enable it in the deployed app, upload the extracted `autumn-leaves-backing-track.m4a` to the target branch under `web/public/audio/backing-tracks/`, renaming it to `autumn-leaves.m4a`. No re-encoding is needed. Commit **only the audio**, never the original MP4 video.

The source video shows an Autumn Leaves chord sequence with a G-minor tonal center, but its recorded BPM and precise first-beat offset are not verified. Therefore `chartId`, `recordedBpm`, and `chartStartSeconds` are intentionally null. The Player opens in **audio-only mode** and never substitutes an unrelated seed chart.

## Adding additional owner recordings

1. Verify permission to distribute the recording. A single stereo MP3, M4A, or WAV is enough; separated stems are optional future work.
2. Add the file to `web/public/audio/backing-tracks/` and register metadata in `web/src/features/recordings/recordingCatalog.ts`.
3. If you have a matching chord chart, set its existing stable `chartId`, the original `recordedBpm` (quarter-note BPM), and `chartStartSeconds` (actual first chart beat after any count-in). Only then enable chart synchronization.
4. If those facts are unknown, leave chart synchronization disabled. Audio-only playback supports Play/Pause, Seek, Restart, Finish and saved practice duration.
5. Test on iPhone Safari. Validate the exact recording from the installed/deployed origin, not a local or synthetic placeholder.

## Integration constraints

- Recorded sound plays at its original pitch and speed. Chart transposition/reference tempo controls do not change audio.
- Do not use `native-audio/stemTransport.ts` synthetic tones as backing audio.
- Do not change the approved chart-first P02 design. Audio-only mode is an additive view only when no chart is linked.
- Supabase/file-upload UI, stem mixing, DSP transposition, and tempo-stretching are not included.
- Do not merge this PR until build, tests, mobile QA, and actual playback from the uploaded M4A are verified.
