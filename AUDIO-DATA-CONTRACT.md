# Audio and music-data contract

1. **Recording**: A licensed human-recorded asset, mixed audio URL optional, key (concert), original BPM, time signature, duration, source and performer attribution, usage rights, user owner, nullable storage object ID and revocable URL. Never bake a URL into exercises. Audio asset can be unlinked/deleted without deleting a routine or its chart.
2. **Stem**: A file associated with one recording, named instrument, sample rate, channel count, original duration, exact start offset and mix gain. All stems align to the *same* recording timeline; independent sliders are enabled only when at least two verified stems exist.
3. **Chart**: Musical events independent of an audio recording. `jazz-seed-content.json.charts` contains semantic bar positions and beat positions. Chart transposition is purely a notational transformation unless audio processor installed.
4. **Sync map**: Optional measured recording time for bar and beat downbeats; never assume a fixed BPM grid matches a live jazz band. Do not claim loop accuracy or bar highlighting synchronized to audio until validated on actual recordings.
5. **Processing adapters**: `loadRecording`, `play`, `pause`, `seek`, `setStemGain`, optional `timeStretch`, `pitchShift`, `separateStems`. A missing adapter must disable the relevant control. `recordUserPractice` is a separate future capture service with privacy requirements.
6. **Storage**: no user-uploaded audio storage or third-party rights issues required by Sunday; a no-audio routine is fully valid. If audio uploads are later added, ensure signed URLs and ownership checks. No public bucket containing private user recordings.

**The app should explicitly say** “No backing track attached. You can still practice with your timer or metronome.” It must not imply real recordings or stems are bundled when none are.
