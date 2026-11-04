# Recorded backing tracks: stereo audio without stems

## First track: Autumn Leaves

The project owner supplied an MP4 and confirmed that it is their video. Only the **AAC stereo audio** is used; there is no video component.

- **Track title:** Autumn Leaves
- **ID:** `autumn-leaves`
- **Audio asset path:** `web/public/audio/backing-tracks/autumn-leaves.m4a`
- **Duration:** approximately 4:06
- **Format:** AAC audio in an M4A container, stereo, 44.1 kHz, about 128 kb/s
- **Status:** Original, complete 3,971,609-byte M4A was committed to the PR branch. The Tracks card verifies the served audio MIME type before enabling playback.
- **Verified SHA-256:** `9147983fe41de999ce934ed0e7e082c12bb43ac75593dd08eaa7b2fffcb9accc`
- **Verified Git blob SHA-1:** `1acd6abee87eeac7724346ab56199ab7a56cec0f`

The owner-supplied M4A was transferred byte-for-byte into `web/public/audio/backing-tracks/autumn-leaves.m4a`. No re-encoding occurred. The original MP4 video was not committed. Temporary base64 staging parts and the one-time assembly workflow have already been removed from the branch.

The user supplied the original 720p MP4 with the on-screen chart. The chart was transcribed measure-for-measure from that video, not replaced by a generic Autumn Leaves lead sheet. The stable chart ID is `autumn-leaves-gm-video-35` (35 displayed boxes, including a 3-bar ending tag). The 32-bar form plays 4 complete passes, then bars 1–30 of the fifth pass, followed by tag bars 33–35. Blank measures in the video remain empty chord boxes. Video-highlight timing is 170 quarter notes per minute, with the first highlighted bar at approximately 5.767s; the player uses a 5.75s alignment offset. The last 12 seconds after the visual chart fades are outro, so the chart holds at its final bar. Playback's actual media time is the master clock.

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
- Do not merge this PR until build, tests, mobile QA, and actual playback from the uploaded M4A are verified. The Git blob hash alone proves identical bytes, not that iPhone Safari playback has been tested.
