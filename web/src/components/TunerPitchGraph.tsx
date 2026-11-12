import { useEffect, useMemo, useRef, useState } from 'react';
import { midiToName, type PitchTrailSample } from '../pages/toolsAudio';
import './TunerPitchGraph.css';

type GraphProps = {
  samples: PitchTrailSample[];
  compact?: boolean;
  savedAt?: string;
};

const STEP_MS = 250;
const PIXELS_PER_STEP = 1.5;
const PLOT_BOTTOM = 112;
const MIN_LABEL_GAP = 80;
const timeLabel = (time: number) => new Date(time).toLocaleTimeString(undefined, {
  hour: 'numeric', minute: '2-digit',
});

/** A measured-pitch timeline. Its x axis only advances when new valid notes arrive.
 * Silence inserts one line break, not hundreds of blank samples or fake notes.
 * Real wall-clock times are retained independently for the 5-minute labels.
 */
export function TunerPitchGraph({ samples, compact = false, savedAt }: GraphProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);
  const [viewportWidth, setViewportWidth] = useState(320);
  const [scrollLeft, setScrollLeft] = useState(0);
  const first = samples[0]?.timestamp ?? 0;
  const last = samples.at(-1)?.timestamp ?? first;
  const width = compact ? Math.max(280, viewportWidth) :
    Math.max(viewportWidth, 24 + (last - first) / STEP_MS * PIXELS_PER_STEP);
  const x = (timestamp: number) => compact
    ? 12 + (timestamp - first) / Math.max(1, last - first) * (width - 24)
    : 12 + (timestamp - first) / STEP_MS * PIXELS_PER_STEP;

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const update = () => setViewportWidth(node.clientWidth || 320);
    update();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(node);
    return () => observer?.disconnect();
  }, []);

  useEffect(() => {
    if (compact || !followRef.current) return;
    const node = viewportRef.current;
    if (!node) return;
    node.scrollLeft = Math.max(0, node.scrollWidth - node.clientWidth);
    setScrollLeft(node.scrollLeft);
  }, [compact, samples.length, width]);

  const renderData = useMemo(() => {
    const startX = compact ? 0 : Math.max(0, scrollLeft - 16);
    const endX = compact ? width : scrollLeft + viewportWidth + 16;
    const visible = samples.filter(p => x(p.timestamp) >= startX && x(p.timestamp) <= endX);
    const midi = visible.filter(p => p.frequency !== null && p.frequency > 0)
      .map(p => 69 + 12 * Math.log2(p.frequency! / 440));
    const sorted = [...midi].sort((a, b) => a - b);
    // A short false octave reading should not compress the entire graph.
    const lowObserved = sorted[Math.floor(Math.max(0, (sorted.length - 1) * 0.04))] ?? 69;
    const highObserved = sorted[Math.ceil(Math.max(0, (sorted.length - 1) * 0.96))] ?? 69;
    const low = Math.floor(Math.min(lowObserved, highObserved) - 2);
    const high = Math.ceil(Math.max(highObserved, low + 5) + 2);
    const segments: string[] = [];
    let points: string[] = [];
    for (const p of visible) {
      if (p.frequency === null || p.frequency <= 0) {
        if (points.length) segments.push(points.join(' '));
        points = [];
        continue;
      }
      const note = 69 + 12 * Math.log2(p.frequency / 440);
      const y = Math.max(8, Math.min(104, 104 - (note - low) / (high - low) * 96));
      points.push(x(p.timestamp).toFixed(1) + ',' + y.toFixed(1));
    }
    if (points.length) segments.push(points.join(' '));
    return { segments, lowNote: midiToName(low), highNote: midiToName(high) };
  }, [samples, compact, scrollLeft, viewportWidth, width]);

  const ticks = useMemo(() => {
    const source = samples.filter(p => p.frequency !== null && p.frequency > 0);
    if (!source.length) return [];
    const fallbackEnd = savedAt ? Date.parse(savedAt) : NaN;
    const fallbackStart = Number.isFinite(fallbackEnd) ? fallbackEnd - (last - first) : NaN;
    const clock = (p: PitchTrailSample) => p.wallTime ??
      (Number.isFinite(fallbackStart) ? fallbackStart + p.timestamp - first : null);
    const result: Array<{ at: number; label: string }> = [];
    let priorBucket = -1;
    let priorX = -Infinity;
    const add = (p: PitchTrailSample, force = false) => {
      const time = clock(p);
      if (time === null) return;
      const px = x(p.timestamp);
      const bucket = Math.floor(time / 300000);
      if (force || (bucket !== priorBucket && px - priorX >= MIN_LABEL_GAP)) {
        result.push({ at: px, label: timeLabel(time) });
        priorX = px;
      }
      priorBucket = bucket;
    };
    add(source[0], true);
    for (const p of source.slice(1)) add(p);
    const end = source.at(-1)!;
    if (x(end.timestamp) - priorX >= MIN_LABEL_GAP) add(end, true);
    return result;
  }, [samples, compact, width, savedAt]);

  return <div className={'tuner-trail-plot tuner-history-graph' + (compact ? ' tuner-history-graph-compact' : '')}>
    <span className="tuner-trail-high">{renderData.highNote}</span>
    <div ref={viewportRef} className="tuner-history-scroll" tabIndex={0}
      role="region" aria-label={compact ? 'Saved pitch chart' : 'Scroll through pitch history'}
      onScroll={event => {
        const node = event.currentTarget;
        setScrollLeft(node.scrollLeft);
        if (!compact) followRef.current = node.scrollWidth - node.clientWidth - node.scrollLeft < 30;
      }}>
      <svg width={width} height="152" viewBox={`0 0 ${width} 152`} role="img"
        aria-label="Detected pitch with breaks during silence and local time markers">
        <line x1="0" y1="32" x2={width} y2="32" stroke="#dedecf" strokeDasharray="4 6" />
        <line x1="0" y1="82" x2={width} y2="82" stroke="#dedecf" strokeDasharray="4 6" />
        {renderData.segments.map((points, i) => <polyline key={i} points={points}
          fill="none" stroke="#397456" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />)}
        {ticks.map(t => <g key={t.at}>
          <line x1={t.at} x2={t.at} y1={PLOT_BOTTOM + 4} y2="122" stroke="#9cb5a4" />
          <text x={t.at} y="141" fontSize="10" textAnchor="middle" fill="#557267">{t.label}</text>
        </g>)}
      </svg>
    </div>
    <span className="tuner-trail-low">{renderData.lowNote}</span>
    {!samples.some(p => p.frequency !== null) &&
      <p className="tuner-graph-empty">Play a note to begin your pitch history.</p>}
  </div>;
}
