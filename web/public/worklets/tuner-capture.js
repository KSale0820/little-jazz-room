// Real-time capture-only processor. The tuner still computes pitch from
// microphone PCM on the app side. Audio is never recorded or uploaded.
class TunerCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ring = new Float32Array(8192);
    this.position = 0;
    this.filled = 0;
    this.sinceFrame = 0;
    this.hop = Math.max(128, Math.round(sampleRate / 12));
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (input && input.length) {
      for (let i = 0; i < input.length; i++) {
        this.ring[this.position] = input[i];
        this.position = (this.position + 1) % this.ring.length;
        if (this.filled < this.ring.length) this.filled++;
      }
      this.sinceFrame += input.length;
      if (this.filled === this.ring.length && this.sinceFrame >= this.hop) {
        // Ordered oldest-to-newest, matching AnalyserNode's time domain data.
        const frame = new Float32Array(this.ring.length);
        for (let i = 0; i < frame.length; i++) {
          frame[i] = this.ring[(this.position + i) % this.ring.length];
        }
        this.port.postMessage(
          { type: 'frame', samples: frame.buffer, sampleRate },
          [frame.buffer],
        );
        this.sinceFrame = 0;
      }
    }
    return true;
  }
}

registerProcessor('ljr-tuner-capture', TunerCaptureProcessor);
