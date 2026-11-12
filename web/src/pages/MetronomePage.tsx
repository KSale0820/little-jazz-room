import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PracticeMetronomeControls } from '../components/PracticeMetronomeSheet';
import { usePracticeMetronome } from '../lib/usePracticeMetronome';
import './MetronomeStandalone.css';

/** Practice Hub's Metronome opens a full page using the exact control language
 * of the chart-player popup. It has its own independently running audio clock;
 * the player popup remains synchronized to the track when available. */
export function MetronomePage({ onClose }: { onClose?: () => void } = {}) {
  const navigate = useNavigate();
  const controller = usePracticeMetronome();

  // Retain the original standalone metronome's enabled count-in default.
  // The in-player popup keeps its own count-in preference.
  useEffect(() => {
    controller.setCountIn(true);
  }, [controller.setCountIn]);

  const close = onClose ?? (() => navigate('/practice'));
  return <div className="practice-metronome-standalone" aria-label="Metronome">
    <PracticeMetronomeControls controller={controller} mode="page" onClose={close} />
  </div>;
}
