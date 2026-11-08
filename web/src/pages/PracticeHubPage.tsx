import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PixelIcon } from '../components/PixelIcon';
import { useApp } from '../context/AppContext';
import { VISUAL_ASSETS } from '../assets/visualManifest';
import { DecorativeCat } from '../features/cats/DecorativeCat';
import { timeGreeting } from '../lib/greeting';
import { computeGentleStreak, minutesToday, minutesYesterday } from '../lib/practiceStats';
import { readPinnedPracticeRoutine, readPracticeGoal, savePracticeGoal } from '../lib/practiceHomePreferences';
import './PracticeHubPage.css';
import './CleanPixelPractice.css';
import './CleanPixelMotifPlacements.css';
import './PracticeSuaveStudio.css';

const ART = '/visuals/new-assets/2026-11-07-sharp-pixel/';
const ICON = ART + 'approved-isolated-icons/';

export function PracticeHubPage() {
  const navigate = useNavigate();
  const { repo, catId, sessions, routines, setActiveRoutineId } = useApp();
  const [dailyGoal, setDailyGoal] = useState(() => readPracticeGoal(repo.scope));
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(dailyGoal));
  const pinId = readPinnedPracticeRoutine(repo.scope);
  const pinned = routines.find(routine => routine.id === pinId);
  const latestSession = [...sessions].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0];
  const recentRoutine = latestSession?.routineId ? routines.find(r => r.id === latestSession.routineId) : null;
  const today = minutesToday(sessions);
  const yesterday = minutesYesterday(sessions);
  const streak = computeGentleStreak(sessions);
  const percent = Math.min(100, Math.max(0, (today / dailyGoal) * 100));
  const encouragement = today >= dailyGoal
    ? 'Goal reached! Enjoy the progress you made today.'
    : today > 0 ? 'You showed up today. Every minute counts.'
      : yesterday > 0 ? 'Yesterday counted. Keep your jazz journey going.'
        : 'A few focused minutes are a great place to start.';

  useEffect(() => {
    if (!goalOpen) return;
    const esc = (event: KeyboardEvent) => { if (event.key === 'Escape') setGoalOpen(false); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [goalOpen]);
  const startFree = () => { setActiveRoutineId(null); navigate('/free-practice'); };
  const startPinned = () => {
    if (!pinned) return;
    setActiveRoutineId(pinned.id);
    navigate('/player?routine=' + encodeURIComponent(pinned.id));
  };
  const continuePractice = () => {
    if (!latestSession) return;
    setActiveRoutineId(recentRoutine?.id ?? null);
    navigate(recentRoutine ? '/player?routine=' + encodeURIComponent(recentRoutine.id) : '/free-practice');
  };
  const submitGoal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const minutes = Number(goalDraft);
    if (!Number.isFinite(minutes) || minutes < 5 || minutes > 240) return;
    setDailyGoal(savePracticeGoal(repo.scope, minutes));
    setGoalOpen(false);
  };
  const growthArt = percent >= 100 ? VISUAL_ASSETS.approvedPixelMotifs.plantPot
    : percent >= 50 ? VISUAL_ASSETS.approvedPixelMotifs.smallPlant : ICON + 'sprout.png';

  return (
    <section className="p01-page p01-suave" aria-label="Practice hub">
      <header className="p01-header p01-suave-header">
        <div className="p01-suave-brand">
          <img src={VISUAL_ASSETS.brand.wordmark} alt="Little Jazz Room" />
          <img className="p01-suave-floating-note" src={ART + 'music-note-purple-sharp.png'} alt="" aria-hidden="true" />
        </div>
        <div className="p01-suave-vignette" aria-hidden="true">
          <img src={VISUAL_ASSETS.sharedMvp.covers.evening} alt="" />
          <img className="p01-suave-vine" src={VISUAL_ASSETS.approvedPixelMotifs.hangingPlant} alt="" />
        </div>
        <p className="p01-greeting">{timeGreeting().replace(/\.$/, ',')}</p>
        <h1>Let&apos;s Practice</h1>
        <p className="p01-intro">{encouragement}</p>
        <div className="p01-suave-coach">
          <span className="p01-suave-bubble">Start with <strong>10 minutes.</strong> ♪</span>
          <DecorativeCat catId={catId} variant="sleeping" className="p01-suave-coach-cat" size={67} />
        </div>
        <div className="p01-momentum" aria-label="Recent practice activity">
          <span className="p01-momentum-item">
            <img src={VISUAL_ASSETS.streakFlame} width="19" height="19" alt="" aria-hidden="true" />
            <strong>{streak}</strong> day streak
          </span>
          <span className="p01-momentum-divider" aria-hidden="true">|</span>
          <span className="p01-momentum-item">
            <svg className="p01-momentum-clock" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            <strong>{yesterday}</strong> min yesterday
          </span>
        </div>
      </header>

      {latestSession && (
        <section className="p01-continue" aria-label="Continue your practice">
          <button type="button" className="p01-continue-button" onClick={continuePractice}>
            <span className="p01-continue-icon" aria-hidden="true">▶</span>
            <span className="p01-continue-copy"><strong>Practice Again</strong><small>{recentRoutine?.title ?? 'Free Practice'} · Last session</small></span>
            <span className="p01-chevron" aria-hidden="true">›</span>
          </button>
        </section>
      )}

      <div className="p01-actions" aria-label="Start practicing">
        <button type="button" className="p01-action p01-action-primary" onClick={startFree}>
          <span className="p01-action-copy">
            <strong>Free Practice</strong><small>Start a session at your own pace.</small>
          </span>
          <img className="p01-suave-sax" src={ICON + 'saxophone-poster.png'} alt="" aria-hidden="true" />
          <span className="p01-chevron" aria-hidden="true">›</span>
        </button>
        <div className="p01-suave-action-pair">
          <button type="button" className="p01-action p01-action-secondary" onClick={() => navigate('/tracks')}>
            <span className="p01-action-icon" aria-hidden="true"><PixelIcon route="tracks" /></span>
            <span className="p01-action-copy"><strong>Practice with a Track</strong><small>Find a chart or track study.</small></span>
            <span className="p01-chevron" aria-hidden="true">›</span>
          </button>
          <button type="button" className="p01-action p01-action-secondary" onClick={() => navigate('/routines')}>
            <span className="p01-action-icon" aria-hidden="true"><PixelIcon route="routines" /></span>
            <span className="p01-action-copy"><strong>Follow a Routine</strong><small>Choose a guided practice plan.</small></span>
            <span className="p01-chevron" aria-hidden="true">›</span>
          </button>
        </div>
      </div>

      <section className="p01-suave-pinned" aria-label="Pinned routine">
        <span className="p01-suave-pin-symbol" aria-hidden="true">▮</span>
        <div className="p01-suave-pin-copy"><strong>Pinned Routine</strong><span>{pinned?.title ?? 'Choose a routine to pin'}</span></div>
        {pinned && <button type="button" className="p01-suave-start" onClick={startPinned} aria-label={'Start ' + pinned.title}><img src={ICON + 'play.png'} alt="" />Start</button>}
        <button type="button" className="p01-suave-pin-browse" onClick={() => navigate('/routines')} aria-label={pinned ? 'Change pinned routine' : 'Choose a routine to pin'}>›</button>
      </section>

      <section className="p01-tools" aria-labelledby="p01-tools-heading">
        <h2 id="p01-tools-heading">Quick Tools <span aria-hidden="true">✦</span></h2>
        <div className="p01-tool-grid">
          <button type="button" className="p01-tool" onClick={() => navigate('/tuner')}>
            <span className="p01-tuning-fork" aria-hidden="true" /><strong>Tuner</strong>
          </button>
          <button type="button" className="p01-tool" onClick={() => navigate('/metronome')}>
            <span className="p01-metronome-symbol" style={{ WebkitMaskImage: `url("${VISUAL_ASSETS.icons.metronome}")`, maskImage: `url("${VISUAL_ASSETS.icons.metronome}")` }} aria-hidden="true" /><strong>Metronome</strong>
          </button>
        </div>
      </section>

      <section className="p01-daily" aria-label="Daily practice progress">
        <button type="button" className="p01-suave-goal-row" onClick={() => { setGoalDraft(String(dailyGoal)); setGoalOpen(true); }} aria-label={'Edit daily practice goal, currently ' + dailyGoal + ' minutes'}>
          <span className="p01-suave-target" aria-hidden="true">◎</span>
          <span className="p01-suave-goal-copy"><strong>Practice Goal</strong><small>Your daily practice time.</small></span>
          <span className="p01-suave-goal-value">{dailyGoal} min / day</span><span className="p01-chevron" aria-hidden="true">›</span>
        </button>
        <div className="p01-suave-rule" />
        <div className="p01-daily-header"><span>Today&apos;s Practice</span><strong>{today} / {dailyGoal} min</strong></div>
        <div className="p01-suave-progress-layout">
          <div className="p01-daily-track" role="progressbar" aria-label="Daily practice goal" aria-valuemin={0} aria-valuemax={dailyGoal} aria-valuenow={Math.min(today,dailyGoal)} aria-valuetext={today + ' of ' + dailyGoal + ' minutes practiced today'}>
            <div className="p01-daily-fill" style={{ width: percent + '%' }} />
          </div>
          <img className="p01-suave-growing-plant" src={growthArt} alt="" aria-hidden="true" />
        </div>
      </section>
      {goalOpen && <div className="p01-suave-modal" onClick={() => setGoalOpen(false)}>
        <form className="p01-suave-goal-editor" role="dialog" aria-modal="true" aria-labelledby="p01-goal-dialog-title" onClick={event => event.stopPropagation()} onSubmit={submitGoal}>
          <h2 id="p01-goal-dialog-title">Set your practice goal</h2>
          <p>How many minutes would you like to practice each day?</p>
          <label htmlFor="p01-goal-minutes">Daily minutes</label>
          <input id="p01-goal-minutes" type="number" min={5} max={240} step={5} value={goalDraft} onChange={event => setGoalDraft(event.target.value)} required autoFocus />
          <div className="p01-suave-goal-buttons"><button type="button" onClick={() => setGoalOpen(false)}>Cancel</button><button type="submit">Save goal</button></div>
        </form>
      </div>}
    </section>
  );
}
