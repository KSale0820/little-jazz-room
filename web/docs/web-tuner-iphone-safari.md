# Web tuner input troubleshooting (iPhone + Vercel)

The public Vercel website uses Safari's `getUserMedia` and Web Audio APIs,
**not** Capacitor's iOS `Info.plist`. PR #25's native permission key does
not change Safari web deployments.

## Observed behavior

Permission appears and is accepted, but the Tuner displays no note. This
can happen if the AudioContext is left suspended/interrupted after a
permission prompt, or if the input RMS is below the previous 0.012 detection
threshold. We have not reproduced the user's precise iPhone failure.

## Web patch

- Initiates AudioContext.resume() and getUserMedia() in the same user tap
  without awaiting resume before requesting the microphone
- Ignores transient page hiding while the permission dialog is pending
- Keeps the input analyser connected to the active audio graph through a
  zero-gain output, so **the mic is never audibly looped to speakers**
- Reports the actual input state: Safari paused audio, mic silence,
  audio heard without stable pitch, or detected note
- Lets the user tap Resume audio when Safari interrupts the context
- Lowers the input RMS gating threshold; the periodicity algorithm still
  rejects silence and non-pitched audio
- Never records, uploads, or stores the microphone samples

## Testing

- `npm test`: checks A440 and quiet amplitude with synthesized sample arrays
- `node scripts/check-tuner-microphone.mjs`: Chromium fake OS microphone
  plays a generated WAV A440 through the real browser capture and analyser,
  and verifies the app displays A4 and a frequency near 440 Hz.
- Automated Chromium capture does **not** substitute for physical iPhone
  Safari or a Home Screen installed web app.

## Retest on Vercel

Ensure the deployment builds the branch containing this fix, then open the
HTTPS deployment directly in Safari, not inside a third-party in-app
browser. In Practice → Tuner, tap Enable microphone and Allow; hold a
single sustained note. If no note is shown, report the diagnostic text:

- **Microphone is connected, but no sound is reaching the tuner**:
  check headphones/Bluetooth microphone and try a louder nearby note
- **Sound detected. Hold one clear note steadily**: input reached the
  analyser, but the note is too unstable/noisy for confident pitch
- **Safari paused audio**: use the new Resume audio button
- **Waiting for permission**: still blocked in the browser request;
  reload Safari and try again

A web app hosted by Vercel cannot acquire microphone input on behalf of
Safari without a user gesture and permission.
