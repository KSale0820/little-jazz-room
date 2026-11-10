import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CatChooser, CatSprite, JAZZ_CATS, isVisibleCatId } from '../features/cats/CatCompanion';
import { cumulativePracticeMinutes, readPreviouslySelectedCat, readSavedUnlocks, saveUnlockedCompanions, unlockedCompanions } from '../lib/companionUnlocks';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getSupabaseClient } from '../lib/supabase/client';
import { readProfileName, saveProfileName, normalizeProfileName } from '../lib/profileName';
import { downloadPracticeSessionsCsv } from '../lib/practiceExport';
import './ProfilePage.css';

export function ProfilePage() {
  const {
    catId, chooseCat, catSaveError,
    catMotion, setCatMotion,
    sessions, routines, repo,
    showToast, setActiveRoutineId,
  } = useApp();
  const { user } = useAuth();
  const accountKey = repo.scope;
  const authName = String(user?.user_metadata?.display_name ?? user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? '');
  const [profileName, setProfileName] = useState(() => readProfileName(accountKey, authName));
  const [draftName, setDraftName] = useState(profileName);
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState('');
  useEffect(() => { const next = readProfileName(accountKey, authName); setProfileName(next); setDraftName(next); setEditingName(false); setNameMessage(''); }, [accountKey, authName]);

  const saveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = normalizeProfileName(draftName);
    if (!next) { setNameMessage('Enter a display name.'); return; }
    setSavingName(true);
    const localSaved = saveProfileName(accountKey, next);
    let cloudSaved = false;
    if (user) {
      try { const client = getSupabaseClient(); if (client) { const { error } = await client.auth.updateUser({ data: { display_name: next } }); cloudSaved = !error; } }
      catch { cloudSaved = false; }
    }
    if (localSaved || cloudSaved) { setProfileName(next); setEditingName(false); showToast('Display name updated.'); }
    setNameMessage(!cloudSaved && user ? 'Saved on this device; account sync unavailable.' : !localSaved && !cloudSaved ? 'Unable to save display name.' : '');
    setSavingName(false);
  };
  const navigate = useNavigate();
  const location = useLocation();
  const chooserRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if ((location.state as { scrollToCat?: boolean } | null)?.scrollToCat) {
      chooserRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [location.state]);

  const sessionCount  = sessions.length;
  const minutes       = sessions.reduce((n, s) => n + Math.round(s.durationSeconds / 60), 0);
  const routineCount  = routines.length;

  const cat = JAZZ_CATS.find(c => c.id === catId)!;
  const practiceMinutes = cumulativePracticeMinutes(sessions);
  const unlockedIds = unlockedCompanions(practiceMinutes, readSavedUnlocks(accountKey), readPreviouslySelectedCat(accountKey));
  const unlockSignature = unlockedIds.join(',');
  useEffect(() => { saveUnlockedCompanions(accountKey, unlockedIds); }, [accountKey, unlockSignature]);

  return (
    <section className="page profile-page" aria-label="Profile">

      {/* ── Page heading ── */}
      <div className="profile-heading">
        <div className="profile-heading-text">
          <h1 className="profile-title">Profile</h1>
          <p className="profile-subtitle">Your jazz companion and practice history.</p>
        </div>
      </div>

      {/* ── Account and export actions (original demo styling) ── */}
      <div className="box profile-section profile-account-actions" aria-label="Profile actions">
        <h2>Account</h2>
        {editingName ? (
          <form onSubmit={saveName} className="profile-name-form">
            <label htmlFor="profile-display-name">Display name</label>
            <input id="profile-display-name" value={draftName} maxLength={40} autoComplete="nickname" onChange={event => setDraftName(event.target.value)} required />
            <div><button className="btn" type="submit" disabled={savingName}>Save</button> <button className="btn" type="button" disabled={savingName} onClick={() => { setEditingName(false); setNameMessage(''); }}>Cancel</button></div>
          </form>
        ) : (
          <div className="profile-name-row"><span>Display name: <strong>{profileName}</strong></span><button className="btn" type="button" onClick={() => { setDraftName(profileName); setEditingName(true); }}>Edit</button></div>
        )}
        {nameMessage && <p role="status" className="profile-save-error">{nameMessage}</p>}
        <button type="button" className="btn profile-export-button" disabled={!sessions.length} onClick={() => downloadPracticeSessionsCsv(sessions)}>
          Export practice history (CSV)
        </button>
      </div>

      {/* ── Active companion card ── */}
      <div className="profile-companion-card">
        <div className="profile-companion-info">
          <span className="profile-companion-badge">Your companion</span>
          <h2 className="profile-companion-name">{cat.name}</h2>
          <p className="profile-companion-detail">{cat.instrument}</p>
          <p className="profile-companion-detail profile-companion-muted">{cat.age} · {cat.build} · {cat.personality}</p>
          <button
            type="button"
            className="profile-companion-change"
            onClick={() => chooserRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            Change companion
          </button>
        </div>
        <div className="profile-companion-art">
          <CatSprite catId={catId} size={140} animated={catMotion} variant="floor" decorative />
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="profile-stats-grid">
        <div className="profile-stat">
          <strong>{sessionCount}</strong>
          <span>sessions</span>
        </div>
        <div className="profile-stat">
          <strong>{minutes}</strong>
          <span>minutes</span>
        </div>
        <div className="profile-stat">
          <strong>{routineCount}</strong>
          <span>routines</span>
        </div>
      </div>

      {/* ── Earned companion chooser, using existing class-demo illustrations ── */}
      <div ref={chooserRef} className="profile-section">
        <CatChooser
          catId={catId}
          unlockedIds={unlockedIds}
          practiceMinutes={practiceMinutes}
          onSelect={async id => {
            if (!isVisibleCatId(id) || !unlockedIds.includes(id)) return;
            await chooseCat(id);
            showToast(`${JAZZ_CATS.find(c => c.id === id)!.name} is now your companion.`);
          }}
        />
        {catSaveError ? <p className="profile-save-error">{catSaveError}</p> : null}
      </div>

      {/* ── Motion preference ── */}
      <label className="profile-motion-label">
        <input type="checkbox" checked={catMotion} onChange={e => setCatMotion(e.target.checked)} />
        Gentle cat animation
      </label>

      <div className="box profile-section">
        <button type="button" className="mutelink" onClick={() => navigate('/progress')}>
          View practice calendar and history on Progress ›
        </button>
      </div>

      {/* ── Saved routines ── */}
      <div className="box profile-section">
        <h3>Saved routines</h3>
        {routines.slice(0, 6).map(r => (
          <div key={r.id} className="minirow">
            <div>
              <strong>{r.title}</strong>
              <br />
              <small>{r.duration_minutes} min · {r.is_seed === false ? 'Yours' : 'Seed sample'}</small>
            </div>
            <button
              type="button"
              className="mutelink"
              onClick={() => { setActiveRoutineId(r.id); navigate('/player'); }}
            >
              Practice
            </button>
          </div>
        ))}
      </div>

      {/* ── Achievements (preview) ── */}
      <div className="box profile-section">
        <h3>Achievements</h3>
        <p className="muted" style={{ marginTop: 7 }}>
          First practice · gentle streak · first routine <em>(preview badges)</em>
        </p>
      </div>

      {/* ── Friends and challenges (preview) ── */}
      <div className="box profile-section">
        <h3>Friends and challenges</h3>
        <p className="muted" style={{ marginTop: 7 }}>
          Preview · Share goals and community challenges in a future release.
        </p>
      </div>

    </section>
  );
}
