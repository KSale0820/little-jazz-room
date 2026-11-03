# Sustained iPhone microphone capture improvements

## Motivation

After merging PR #26 and PR #32, the physical iPhone tuner detects a sung
note initially but can lose it after sustained singing. This patch improves
the audio capture scheduling and adapts the pitch detector to quieter input.
The exact iOS failure cause remains unverified without Safari device traces.

## Architecture

- Primary path: `AudioWorkletProcessor` at `/worklets/tuner-capture.js`
  collects the latest 8,192 PCM samples from the microphone using the Web
  Audio clock and posts frames about 12 times per second.
- The tuner runs its existing YIN pitch estimator on the posted PCM. It
  updates the existing UI and optional pitch graph. Audio output from the
  worklet is silent and fed into an existing zero-gain node to keep the
  audio graph alive. There is no audible monitor/feedback.
- Fallback: the original `AnalyserNode` + requestAnimationFrame path runs
  when AudioWorklet is absent, fails to load, or stops delivering frames
  for more than 750 ms.
- A lower input RMS floor (0.0012) plus stricter periodicity thresholds
  for quiet signals is intended to catch decaying sung notes without
  showing fake notes from total silence.
- The page exposes `data-capture-path` for engineering checks only.

Microphone PCM is processed locally in memory and is never saved or uploaded.

## Verification

- Existing web app test suite + 440 Hz fake-device microphone E2E.
- Add E2E assertion that the AudioWorklet path actually receives PCM
  frames in Chromium, and that the graph uses detected notes from that stream.
- Unit tests simulate fading sung pitches, soft signals, and digital silence.

**A physical iPhone Safari retest is still required.** Worklet support and
privacy constraints differ across iOS versions; the fallback remains enabled.
