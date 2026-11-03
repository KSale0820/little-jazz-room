/**
 * Synchronized PCM test transport. All AudioBufferSourceNodes start at one
 * AudioContext.currentTime, never from independent HTMLAudioElements.
 * Test tones are generated locally and are NOT production backing recordings.
 */
export type LoopRegion = { start: number; end: number };

export function resolveOffset(seconds: number, length: number, loop: LoopRegion | null): number {
  const raw = Math.max(0, Math.min(length, Number.isFinite(seconds) ? seconds : 0));
  if (!loop) return raw;
  if (loop.end <= loop.start || loop.start < 0 || loop.end > length) {
    throw new Error('Invalid loop boundaries');
  }
  return raw < loop.start ? loop.start : loop.start + ((raw - loop.start) % (loop.end - loop.start));
}

export function positionAt(
  clockTime: number,
  anchor: number,
  duration: number,
  loop: LoopRegion | null,
): number {
  return resolveOffset(Math.max(0, clockTime - anchor), duration, loop);
}

type Slot = {
  label: string;
  buffer: AudioBuffer;
  gain: GainNode;
  source?: AudioBufferSourceNode;
  muted: boolean;
  volume: number;
};
export type StemStatus = {
  playing: boolean;
  position: number;
  length: number;
  scheduledSkewMs: number | null;
  stems: Array<{ label: string; volume: number; muted: boolean }>;
};

function makePercussiveTone(ctx: AudioContext, frequency: number): AudioBuffer {
  const length = 12;
  const buffer = ctx.createBuffer(1, length * ctx.sampleRate, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < output.length; i++) {
    const seconds = i / ctx.sampleRate;
    const withinBeat = seconds % 0.75;
    if (withinBeat < 0.20) {
      const fade = Math.exp(-23 * withinBeat);
      output[i] = 0.17 * fade * Math.sin(2 * Math.PI * frequency * withinBeat);
    }
  }
  return buffer;
}

function mixStereo(ctx: AudioContext, one: AudioBuffer, two: AudioBuffer): AudioBuffer {
  const mix = ctx.createBuffer(2, one.length, ctx.sampleRate);
  const a = one.getChannelData(0);
  const b = two.getChannelData(0);
  const left = mix.getChannelData(0);
  const right = mix.getChannelData(1);
  for (let i = 0; i < mix.length; i++) {
    left[i] = a[i] + b[i] * 0.35;
    right[i] = a[i] * 0.35 + b[i];
  }
  return mix;
}

export class StemTransport {
  private ctx: AudioContext | null = null;
  private slots: Slot[] = [];
  private startedAt = 0;
  private heldAt = 0;
  private running = false;
  private loop: LoopRegion | null = null;
  private scheduledSkewMs: number | null = null;
  private readonly durationSeconds = 12;

  private async init(): Promise<AudioContext> {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      const one = makePercussiveTone(this.ctx, 220);
      const two = makePercussiveTone(this.ctx, 330);
      const sources: Array<[string, AudioBuffer, boolean]> = [
        ['Stereo reference mix (muted initially)', mixStereo(this.ctx, one, two), true],
        ['Stem 1: low test tone', one, false],
        ['Stem 2: high test tone', two, false],
      ];
      this.slots = sources.map(([label, buffer, muted]) => {
        const gain = this.ctx!.createGain();
        gain.gain.value = muted ? 0 : 1;
        gain.connect(this.ctx!.destination);
        return { label, buffer, gain, muted, volume: 1 };
      });
    }
    await this.ctx.resume(); // must originate in a user gesture on iOS
    return this.ctx;
  }

  async play(): Promise<void> {
    if (this.running) return;
    const ctx = await this.init();
    const offset = resolveOffset(this.heldAt, this.durationSeconds, this.loop);
    if (!this.loop && offset >= this.durationSeconds) this.heldAt = 0;
    const start = ctx.currentTime + 0.075;
    const from = this.heldAt;
    const scheduled: number[] = [];
    for (const slot of this.slots) {
      const source = ctx.createBufferSource();
      source.buffer = slot.buffer;
      source.connect(slot.gain);
      if (this.loop) {
        source.loop = true;
        source.loopStart = this.loop.start;
        source.loopEnd = this.loop.end;
      }
      source.start(start, from);
      slot.source = source;
      scheduled.push(start);
    }
    this.startedAt = start - from;
    this.running = true;
    // Scheduling skew only. This does NOT measure rendered/output audio drift.
    this.scheduledSkewMs = (Math.max(...scheduled) - Math.min(...scheduled)) * 1000;
  }

  pause(): void {
    if (!this.running) return;
    this.heldAt = this.position();
    this.running = false;
    for (const slot of this.slots) {
      try { slot.source?.stop(); } catch { /* already stopped */ }
      slot.source?.disconnect();
      slot.source = undefined;
    }
  }

  seek(seconds: number): void {
    const restart = this.running;
    if (restart) this.pause();
    this.heldAt = resolveOffset(seconds, this.durationSeconds, this.loop);
    if (restart) void this.play();
  }

  setLoop(region: LoopRegion | null): void {
    if (region && (region.start < 0 || region.end > this.durationSeconds ||
        region.end - region.start < 0.1)) throw new Error('Loop requires a valid interval (minimum 0.1 seconds).');
    const wasPlaying = this.running;
    const at = this.position();
    if (wasPlaying) this.pause();
    this.loop = region;
    this.heldAt = resolveOffset(at, this.durationSeconds, region);
    if (wasPlaying) void this.play();
  }

  setStemVolume(index: number, amount: number): void {
    const slot = this.slots[index];
    if (!slot) throw new Error('Unknown stem');
    slot.volume = Math.max(0, Math.min(1, amount));
    slot.gain.gain.value = slot.muted ? 0 : slot.volume;
  }

  setStemMuted(index: number, muted: boolean): void {
    const slot = this.slots[index];
    if (!slot) throw new Error('Unknown stem');
    slot.muted = muted;
    slot.gain.gain.value = muted ? 0 : slot.volume;
  }

  position(): number {
    if (!this.running || !this.ctx) return this.heldAt;
    return positionAt(this.ctx.currentTime, this.startedAt, this.durationSeconds, this.loop);
  }

  status(): StemStatus {
    return {
      playing: this.running,
      position: this.position(),
      length: this.durationSeconds,
      scheduledSkewMs: this.scheduledSkewMs,
      stems: this.slots.map(slot => ({ label: slot.label, volume: slot.volume, muted: slot.muted })),
    };
  }

  async close(): Promise<void> {
    this.pause();
    await this.ctx?.close();
    this.ctx = null;
    this.slots = [];
    this.heldAt = 0;
    this.scheduledSkewMs = null;
    this.loop = null;
  }
}
