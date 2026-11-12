import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/** A shareable /demo entry point, opt-in and independent of real authentication. */
export function DemoProfileEntryPage() {
  const { demoActive, enterDemo } = useApp();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (demoActive || enterDemo()) {
      navigate('/progress', { replace: true });
    } else {
      setFailed(true);
    }
  }, [demoActive, enterDemo, navigate]);

  return <section className="page" aria-label="Open sample profile">
    <h1>Sample musician profile</h1>
    {failed ? <>
      <p>Sample data could not be saved in this browser. Check whether site storage is blocked or full.</p>
      <button type="button" className="btn" onClick={() => navigate('/profile')}>Back to Profile</button>
    </> : <p>Opening your sample practice history…</p>}
  </section>;
}
