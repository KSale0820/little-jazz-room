# iPhone tuner microphone fix

This patch corrects `NSMicrophoneUsageDescription` in
`ios/App/App/Info.plist`: it must be a top-level key, not nested in
`UIApplicationSceneManifest/UISceneConfigurations`. The native privacy setup
script now repairs nested or duplicate entries after `cap sync`, and
an automated test enforces root placement.

## After rebuilding on an iPhone

1. Run `cd web && npm ci && npm run native:sync && npx cap open ios`.
2. Build and reinstall the app on the phone from Xcode. A web-page refresh
   **does not** replace a native iOS Info.plist.
3. Open Practice → Tuner → Enable microphone. Allow permission when iOS prompts.
   Confirm a played A4 gives a measured note and approximately 440 Hz.
4. If previously denied, open iPhone Settings → Apps → Little Jazz Room →
   Microphone and enable it (or Settings → Privacy & Security → Microphone).
   If the permission never appeared, reinstall the newly compiled app.
5. If the tuner says Listening but shows no pitch, make sure no Bluetooth mic
   is selected, test in a quiet room with one clear note, and collect the
   status message and iPhone iOS version. WebKit/AVAudioSession audio routing
   requires a real-device test and could need a separate native input adapter.

**Verification limit:** Building an unsigned simulator binary and passing
unit tests do not establish that microphone capture or accurate pitch
detection works on an actual iPhone.

For a Safari/browser deployment (rather than installed Capacitor app), a
native Info.plist patch does not apply. Safari needs an HTTPS origin and
microphone permission granted for that website.
