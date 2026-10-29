import { type FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SignInPage.css';

export function SignInPage() {
  const { configured, loading, user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!configured && !loading) {
    return (
      <section className="page pad tight sign-in-page">
        <h1>Team sign-in</h1>
        <p className="muted">Supabase is not configured. Copy `web/.env.example` to `web/.env.local` after creating a project.</p>
        <Link className="btn" to="/">
          Back to app
        </Link>
      </section>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await signIn(email.trim(), password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    navigate('/');
  };

  return (
    <section className="page pad tight sign-in-page" aria-label="Team sign in">
      <h1>Team sign-in</h1>
      <p className="team-beta-note">Team beta: account provided by the project owner. Public signup is disabled.</p>
      <form className="sign-in-form" onSubmit={onSubmit}>
        <label className="form-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="field"
          type="email"
          autoComplete="username"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <label className="form-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="field"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error ? <p className="sign-in-error">{error}</p> : null}
        <button type="submit" className="btn primary wide" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <Link className="mutelink" to="/">
        Continue without signing in (local only)
      </Link>
    </section>
  );
}

export function SignUpRedirect() {
  return <Navigate to="/signin" replace />;
}
