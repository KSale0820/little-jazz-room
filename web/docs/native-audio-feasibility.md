# Little Jazz Room: Native + recorded-audio feasibility

Status: **both native projects generated; iOS simulator compilation passed; no device runtime verification**. Branch: feature/native-audio-foundation.
Base: class-demo-2026-10-31. No app navigation, Practice Player, Supabase schema,
or approved visual asset changes are made.

## Architecture decision

**Capacitor 8 + existing React 19/TypeScript/Vite 8/Supabase web app** is the
low-cost path to iOS/Android. The current web version remains available. Vite
builds the unchanged app at `index.html` and a **separate, unlinked**
`native-audio-lab.html` test harness. Production practice audio is still
not integrated. The lab must never ship as a product feature without review.

Pinned dependencies: @capacitor/core/cli/ios/android 8.6.0 and
@capacitor/filesystem 8.1.5. The npm lockfile must match package.json.

## Reproduce and run

From `web/` (Node 22+, macOS with Xcode 26+ for iOS, or Android Studio/SDK):

```bash
npm ci
npm run build
npm test
npx cap add ios      # only if ios/ is not already present; macOS
npx cap add android  # only if android/ is not already present
npx cap sync
npm run native:privacy
npx cap open ios      # macOS; select an iPhone simulator/device
npx cap open android
```

Use `npm run native:sync` after subsequent web changes. To open the **lab**
without touching React Router, use Safari Web Inspector / Chrome DevTools on
a running native app and navigate its webview to
`window.location.assign('/native-audio-lab.html')`. Main app launches at
`/`. The bundle contains no remote `server.url`; an installed app can
start without internet. Check both `/tracks` and `/player` manually: local
SPA fallback and external auth deep links are not verified on native yet.

The first import MUST be initiated by the file input inside the installed
app. Choose a non-DRM audio file stored in the phone's Files/provider picker.
Audio is copied in 256 KiB base64 chunks to the Capacitor filesystem, then
renamed from `.part` and indexed **only on successful completion**.
On restart, open the lab again; stale interrupted `.part` files are cleaned up,
and the list is loaded from disk, not localStorage.
Play via the app's file URL converted for WKWebView. Delete removes the data
before the metadata record. A missing/corrupt file appears as missing and
cannot be played. The max prototype file size is 250 MiB.

**Actual native import and persistence have NOT been tested on a phone yet.**
Files App / Android provider URIs, codec support, memory headroom, interruption
and restart recovery still need instrumented device validation. GitHub Actions successfully ran the Vite/TypeScript build and unit tests,
generated and synced the Android scaffold, generated an iOS project via SPM,
and built the unsigned iOS Simulator target with Xcode. These steps did **not**
launch a native app, test actual file imports, or run device audio.

## Local privacy and backup

- **No cloud uploads** implemented. The lab imports via the OS file input,
  filesystem bridge and local webview only. It never sends audio to Supabase.
- iOS uses `Directory.LibraryNoCloud`, which excludes the app's private
  recordings from iCloud backup. Files are lost when the app is uninstalled
  unless the user exports them manually in a future feature.
- Android uses the app-private `LibraryNoCloud`-mapped storage directory.
  The native manifest disables `allowBackup` and installs Android 12+ data
  extraction exclusions for cloud backup and device-to-device transfer.
  Confirm with device restore/backup tests before claiming final privacy.
- System file pickers grant per-selection access; do **not** request broad
  storage/gallery read access. The existing tuner requires a user-initiated
  microphone permission. Add iOS NSMicrophoneUsageDescription, Android
  RECORD_AUDIO, and Apple's filesystem privacy-reason manifest.
- Do not store imported audio as data URLs, localStorage, IndexedDB blobs,
  Supabase Storage objects, telemetry, or public routine attachments.
  Imported files can still be exposed by an unlocked/jailbroken phone.
- Provisional metadata: a small JSON sidecar per recording, next to its
  randomized filename. Production migration: versioned SQLite metadata
  index with integrity checks and cleanup of stale `.part` files. Never
  back up private bytes without an explicit user-driven export workflow.

## Stem playback proof of concept

`src/native-audio/stemTransport.ts` supplies a deterministic **12-second**
PCM test with one stereo mix and two independent instrument test tones.
These are owned/generated test samples, **not MIDI** and not intended as
actual licensed jazz backing tracks. All three `AudioBufferSourceNode`s
share one `AudioContext`, a single scheduled `start` timestamp,
common timeline/seek offset, and an optional 2–6 s loop. Each routes
through its own GainNode with volume and mute controls. Source nodes are
recreated on seek, replay or resume. On page hide the lab pauses; locking
the phone and true background audio are NOT implemented.

The lab displays **scheduled start skew = 0 ms** by construction.
This is the equality of JS-supplied timestamps, NOT measured playback
on the DAC, Bluetooth headset, or the device speaker. Audible drift,
device start latency, interruptions and output routing remain **unmeasured**.
Unit tests verify offset/loop math but cannot prove real audio sync.

Known proof limitations: stem PCM is regenerated after restart rather than
persisted as imported stems; a single 12-second AudioBuffer is held in
memory per lane; decode/import failure for unrecognized formats is surfaced;
automatic buffering for hour-long multistem projects is not implemented.
Future recorded stem packages must contain stems aligned to the same
sample-zero and sample rate with explicit offset/length metadata.

## Production recommendation

1. Preserve React/Vite/Supabase for interface, routine metadata and community
   features. Keep **one shared Practice Player** owned by its current agent.
2. Store user-imported audio strictly on-device under randomized app-private
   names, opt out of backup, build an export/recovery UX and remove stale
   partial files. Explicitly mark routine shares as metadata-only.
3. For curated tracks, first secure distribution licenses, then host only
   **owned/licensed** audio at an approved CDN or storage source; download
   through authenticated URLs to the app's offline library. No service or
   subscription selected or purchased by this branch.
4. Use mastered, pre-aligned recorded stems. WAV/CAF/PCM for sample-accurate
   edits; M4A/AAC for smaller downloads when codec delay/encoder padding is
   normalized. Store canonical asset IDs, license metadata, BPM, key,
   sample rate, track durations, sample-zero offsets and checksum.
5. Use the Web Audio shared-context clock for foreground prototype playback.
   Test long stems for memory exhaustion, decode latency, start/seek/loop
   accuracy and Bluetooth latency. For dependable screen-lock/background
   playback, phone audio session policies, or extended stems, plan a native
   iOS AVAudioEngine / Android Oboe or ExoPlayer-based transport with a
   small Capacitor bridge, audio focus and interruption recovery.
6. Use separate audio input/session coordination for microphone tuner and
   output metronome; do not activate the microphone without tapping Tuner.
   Define mixing/ducking and Bluetooth latency expectations before shipping.
7. Do not attempt automatic on-device separation or real-time DSP pitch/key
   shifting in this phase. Preprocess licensed stems offline.

## Test matrix and evidence

| Test | Browser/unit | iOS simulator | iPhone hardware | Android simulator/hardware |
| --- | --- | --- | --- | --- |
| Vite build, TypeScript, unit tests | **passed** on GitHub Actions Ubuntu | not run | not run | not run |
| Native shell/routes/assets | not sufficient | not run | not run | not run |
| OS file picker, import, persistence, delete | code only | not run | not run | not run |
| Offline imported-file playback after restart | code only | not run | not run | not run |
| 2-stem shared-clock schedule/volume/mute/seek/loop | unit timeline only | not run | not run | not run |
| Output drift and seek error, headphones/Bluetooth | not measured | not measured | not measured | not measured |
| Microphone tuner + metronome coexistence | existing web code | not run | not run | not run |
| Incoming call/Siri, app lock, audio focus | not run | not run | not run | not run |
| Low-storage failure and incomplete-import recovery | error handling only | not run | not run | not run |

### Exact environment blocker

The local coding runtime is Linux with Node 22 and **no macOS/Xcode, connected
iPhone, Android SDK/emulator or physical Android phone**, and has no outbound
npm/GitHub network access. GitHub Actions Ubuntu generated Android project
sources; GitHub Actions macOS-26 generated the SPM iOS project and completed
an unsigned **iOS Simulator compilation**. Neither runner launched an iOS or
Android app. Import, audible drift, app lock, audio routes, storage pressure,
and privacy on a physical iPhone remain unverified.

### Suggested device acceptance test

On an iPhone, import a 2-minute WAV and a larger 100 MiB M4A from Files,
force-quit and relaunch, use airplane mode and play, delete one, restart,
repeat with low free storage and app interruption. Verify `.part` recovery
and no private file in cloud backup or Supabase traffic. Repeat 30-minute
two-stem playback, seek 100 times and loop a 4-bar range; capture the
output via loopback and calculate mean/max measured inter-stem onset
error (in samples), drift (ms/hour), start latency (ms) and seek error
(ms). Explicitly record device model, iOS build, route (speaker/wired/
Bluetooth), codec, sample rate, and background setting.

## Remaining decisions / risks

- **Critical:** actual native device testing, App Store privacy/backup
  inspection and private-file URL support in WKWebView.
- **High:** Web Audio full-file decoding can exceed iPhone RAM for long stem
  sets; move to a streaming native engine if needed.
- **High:** no supported background or phone-lock playback; native session
  handling required before claiming those features.
- **Medium:** file format variations, provider imports, unsupported codecs,
  Bluetooth latency, audio interruptions and tuner/metronome contention.
- **Medium:** lack of export on uninstall and untracked orphan `.part` files.
- **Not implemented:** full production audio integration, cloud audio
  distribution, real-time transposition, public audio sharing, separation.
