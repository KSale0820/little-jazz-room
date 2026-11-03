# Chromatic tuner with optional pitch graph and singing support

The separate Voice tab was removed because it duplicated Chromatic note
detection. Sing or hum in **Chromatic**, just as with any instrument.
Use **Show pitch graph** for an eight-second trajectory of measured pitch.

## Recognition improvements (iPhone Safari)
- The YIN detector now analyzes the latest input samples rather than
  older frames in its 8192-sample analyser.
- Less stringent periodicity thresholds and a periodicity-validated
  fallback aim to recognize real-world sung notes with vibrato, harmonics
  and breathiness, without fabricating input from silence or noise.
- The last genuinely measured pitch is held for at most 400 ms during a
  brief missed frame. No interpolated pitches are added to the graph.
- The tuner status retains a fixed height; there is no moving alert.
- Three tabs only: Chromatic, Guitar, Bass. There are no spoken notes.

Microphone audio is never recorded, uploaded or saved. Tests use simulated
vibrato/harmonic voices and an end-to-end browser microphone A440 capture.

These changes need a physical iPhone Safari retest. Synthetic voice and
Chromium browser tests cannot guarantee real-world iPhone singing accuracy.
