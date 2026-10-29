import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Routine } from '../../types/content';
import { PRACTICE_MILESTONE_MINUTES } from '../../lib/practiceStats';
import type { ResolvedLighting, RoomLightingMode } from '../../lib/roomLighting';
import { plantGrowth, stageThresholds } from './plantGrowth';
import { groupRoutines } from './roomPanelState';

const exerciseCount = (r: Routine) => `${r.steps.length} exercise${r.steps.length === 1 ? '' : 's'}`;

interface StandPanelProps {
  routine: Routine | undefined;
  onStart: () => void;
  onOpenNotebook: () => void;
}

export function StandPanelContent({ routine, onStart, onOpenNotebook }: StandPanelProps) {
  if (!routine) {
    return (
      <div className="room-empty">
        <p className="room-lede">Nothing on the stand yet. Pick a routine and it will wait here for you.</p>
        <Link className="room-btn primary" to="/explore">
          Explore routines
        </Link>
        <button type="button" className="room-btn" onClick={onOpenNotebook}>
          Open the notebook
        </button>
      </div>
    );
  }
  return (
    <div className="room-stack">
      <div className="room-sheet-card">
        <h3 className="room-sheet-title">{routine.title}</h3>
        <p className="room-sheet-meta">
          {routine.duration_minutes} min · {exerciseCount(routine)} · {routine.level}
        </p>
        {routine.description ? <p className="room-sheet-desc">{routine.description}</p> : null}
      </div>
      <button type="button" className="room-btn primary" onClick={onStart}>
        Start Practice
      </button>
      <div className="room-row">
        <Link className="room-btn" to="/explore">
          Explore other routines
        </Link>
        <button type="button" className="room-btn" onClick={onOpenNotebook}>
          Switch routine
        </button>
      </div>
    </div>
  );
}

interface NotebookPanelProps {
  routines: Routine[];
  activeRoutineId: string | null;
  onSelect: (id: string) => void;
  onStart: () => void;
}

export function NotebookPanelContent({ routines, activeRoutineId, onSelect, onStart }: NotebookPanelProps) {
  const groups = useMemo(() => groupRoutines(routines), [routines]);
  const renderGroup = (label: string, list: Routine[]) =>
    list.length === 0 ? null : (
      <section className="room-group" aria-label={label}>
        <h3 className="room-group-title">{label}</h3>
        <ul className="room-list">
          {list.map(r => (
            <li key={r.id}>
              <button
                type="button"
                className="room-routine"
                aria-pressed={r.id === activeRoutineId}
                onClick={() => onSelect(r.id)}
              >
                <span className="room-routine-main">
                  <strong>{r.title}</strong>
                  <small>
                    {r.duration_minutes} min · {exerciseCount(r)}
                  </small>
                </span>
                <span className="room-routine-check" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    );

  return (
    <div className="room-stack room-notebook">
      <div className="room-scroll">
        {routines.length === 0 ? <p className="room-lede">No routines yet. Create your first one.</p> : null}
        {renderGroup('Your routines', groups.mine)}
        {renderGroup('Built-in examples', groups.examples)}
      </div>
      <div className="room-footer">
        <button type="button" className="room-btn primary" disabled={!activeRoutineId} onClick={onStart}>
          Start selected routine
        </button>
        <Link className="room-btn" to="/create">
          Create a new routine
        </Link>
      </div>
    </div>
  );
}

interface PlantsPanelProps {
  totalMinutes: number;
  percent: number;
}

export function PlantsPanelContent({ totalMinutes, percent }: PlantsPanelProps) {
  const growth = plantGrowth(totalMinutes);
  const [t1, t2, t3] = stageThresholds();
  const marks = [
    { minutes: t1, label: 'First leaves' },
    { minutes: t2, label: 'Buds appear' },
    { minutes: t3, label: 'Full bloom' },
  ];
  return (
    <div className="room-stack">
      <p className="room-lede">
        Your plants grow with every minute you practice. They never wither if you take a break.
      </p>
      <div className="room-plant-stat">
        <strong>{totalMinutes}</strong>
        <span>minutes practiced · {growth.label.toLowerCase()}</span>
      </div>
      <div
        className="room-meter"
        role="progressbar"
        aria-label="Progress toward your practice milestone"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <i style={{ width: `${percent}%` }} />
      </div>
      <p className="room-sheet-meta">
        {percent}% of the {PRACTICE_MILESTONE_MINUTES}-minute milestone
        {growth.minutesToNext !== null ? ` · ${growth.minutesToNext} min to the next stage` : ' · milestone reached'}
      </p>
      <ol className="room-milestones">
        {marks.map(m => (
          <li key={m.minutes} data-done={totalMinutes >= m.minutes}>
            <span aria-hidden="true" className="room-milestone-dot" />
            <span>
              {m.label}
              <small> · {m.minutes} min</small>
            </span>
            <span className="screen-reader-only">{totalMinutes >= m.minutes ? 'reached' : 'not yet reached'}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

interface LightingPanelProps {
  mode: RoomLightingMode;
  resolved: ResolvedLighting;
  onChange: (mode: RoomLightingMode) => void;
}

const LIGHT_OPTIONS: { mode: RoomLightingMode; label: string; hint: string }[] = [
  { mode: 'auto', label: 'Automatic', hint: 'Follows the time of day' },
  { mode: 'sunshine', label: 'Sunshine', hint: 'Bright and airy' },
  { mode: 'twilight', label: 'Twilight', hint: 'Warm evening glow' },
  { mode: 'night', label: 'Night', hint: 'Quiet and lamp-lit' },
];

export function LightingPanelContent({ mode, resolved, onChange }: LightingPanelProps) {
  return (
    <div className="room-stack">
      <div role="radiogroup" aria-label="Room lighting" className="room-light-options">
        {LIGHT_OPTIONS.map(o => (
          <button
            key={o.mode}
            type="button"
            role="radio"
            aria-checked={mode === o.mode}
            className="room-light-option"
            data-light={o.mode === 'auto' ? resolved : o.mode}
            onClick={() => onChange(o.mode)}
          >
            <span className="room-light-swatch" aria-hidden="true" />
            <span>
              <strong>{o.label}</strong>
              <small>{o.mode === 'auto' ? `Now: ${resolved}` : o.hint}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
