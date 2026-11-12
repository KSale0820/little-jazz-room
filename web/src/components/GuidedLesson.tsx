import { useEffect, useState } from 'react';
import { CatSprite, JAZZ_CATS } from '../features/cats/CatCompanion';
import type { CatId } from '../features/cats/CatCompanion';
import type { GuidedLesson as Lesson } from '../lib/guidedLesson';

interface Props {
  lesson: Lesson;
  stepIndex: number;
  totalSteps: number;
  hideTitle?: boolean;
}

/** Compact, scrollable instructional content, independent of the shared timer. */
export function GuidedLesson({ lesson, stepIndex, totalSteps, hideTitle = false }: Props) {

  return (
    <section className="practice-lesson-scroll" aria-label="Guided lesson instructions" tabIndex={0}>
      <div className="practice-lesson-card">
        {!hideTitle && <header className="practice-lesson-heading">
          <span className="practice-lesson-eyebrow">LESSON {stepIndex + 1} OF {totalSteps}</span>
          <h2>{lesson.title}</h2>
        </header>}

        <section className="practice-lesson-section" aria-labelledby="practice-lesson-goal">
          <h3 id="practice-lesson-goal">Your goal</h3>
          <p>{lesson.goal}</p>
        </section>

        <section className="practice-lesson-section practice-lesson-steps" aria-labelledby="practice-lesson-steps">
          <h3 id="practice-lesson-steps">Try it step by step</h3>
          <ol>
            {lesson.steps.map((step, index) => <li key={index}><span>{step}</span></li>)}
          </ol>
        </section>

        <section className="practice-lesson-section practice-lesson-listen" aria-labelledby="practice-lesson-listen">
          <h3 id="practice-lesson-listen">What to listen for</h3>
          <p>{lesson.listenFor}</p>
        </section>

        <section className="practice-lesson-section practice-lesson-success" aria-labelledby="practice-lesson-success">
          <h3 id="practice-lesson-success">You’re ready to move on when…</h3>
          <p>{lesson.success}</p>
        </section>

        {lesson.terminologyHelp.length > 0 && (
          <section className="practice-lesson-section practice-lesson-terms" aria-labelledby="practice-lesson-terms">
            <h3 id="practice-lesson-terms">Helpful terms</h3>
            <dl>{lesson.terminologyHelp.map(({ term, explanation }, index) => (
              <div key={term + index}>{term !== 'Terminology' && <dt>{term}</dt>}<dd>{explanation}</dd></div>
            ))}</dl>
          </section>
        )}

      </div>
    </section>
  );
}

/** Keep the selected companion and its tip visible outside the scrolling lesson. */
export function GuidedCatCoach({ lesson, catId }: { lesson: Lesson; catId: CatId }) {
  const [coachIndex, setCoachIndex] = useState(0);
  useEffect(() => setCoachIndex(0), [lesson.title]);
  const catName = JAZZ_CATS.find(cat => cat.id === catId)?.name ?? 'Your companion';
  return (
    <aside className="practice-cat-coach" aria-label={catName + ' your jazz coach'}>
      <CatSprite catId={catId} variant="closeup" size={56} className="practice-coach-portrait" decorative />
      <div className="practice-coach-bubble">
        <strong>{catName} says</strong>
        <p>{lesson.catPrompts[coachIndex % lesson.catPrompts.length]}</p>
        {lesson.catPrompts.length > 1 && <button type="button" onClick={() => setCoachIndex(current => (current + 1) % lesson.catPrompts.length)}>
          Another tip
        </button>}
      </div>
    </aside>
  );
}
