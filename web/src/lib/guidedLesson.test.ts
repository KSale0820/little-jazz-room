import { describe, expect, it } from 'vitest';
import { normalizeGuidedLesson } from './guidedLesson';

const base = { title: 'Swing on Two and Four', instructions: 'Set metronome clicks on beats 2 and 4. Clap quarter notes, then swing eighths without rushing.' };

describe('guided lesson normalization', () => {
  it('shows the full structured teaching data and coach prompts', () => {
    const lesson = normalizeGuidedLesson(base, {
      lesson: {
        goal: 'Learn the backbeat.',
        steps: ['Count to four', { text: 'Clap beats two and four' }],
        listenFor: 'Even clicks',
        success: 'Repeat three times',
        terminologyHelp: [{ term: 'Backbeat', definition: 'Beats two and four' }],
        catPrompts: ['Try the pulse.', 'Nice work!'],
      },
    });
    expect(lesson.goal).toBe('Learn the backbeat.');
    expect(lesson.steps).toEqual(['Count to four', 'Clap beats two and four']);
    expect(lesson.listenFor).toBe('Even clicks');
    expect(lesson.success).toBe('Repeat three times');
    expect(lesson.terminologyHelp).toEqual([{ term: 'Backbeat', explanation: 'Beats two and four' }]);
    expect(lesson.catPrompts).toEqual(['Try the pulse.', 'Nice work!']);
  });

  it('renders legacy plain-text exercises without losing instruction content', () => {
    const lesson = normalizeGuidedLesson(base);
    expect(lesson.title).toBe('Swing on Two and Four');
    expect(lesson.steps).toHaveLength(2);
    expect(lesson.steps.join(' ')).toContain('beats 2 and 4');
    expect(lesson.listenFor.length).toBeGreaterThan(10);
    expect(lesson.success.length).toBeGreaterThan(10);
    expect(lesson.catPrompts[0]).toBe('Let\'s start slowly.');
  });

  it('supports numbered legacy instructions and lengthy lessons without truncating them', () => {
    const instructions = Array.from({ length: 40 }, (_, i) => `${i + 1}. Repeat phrase ${i + 1}`).join('\n');
    const lesson = normalizeGuidedLesson({ title: 'Long lesson', instructions });
    expect(lesson.steps).toHaveLength(40);
    expect(lesson.steps[39]).toBe('Repeat phrase 40');
  });

  it('respects structured snapshots and snake_case lesson fields', () => {
    const snap = { title: 'Cloud lesson', instructions: 'Play slowly.', lesson: {
      goal: 'Keep time.', steps: [{ instruction: 'Count four beats' }],
      listen_for: 'Clear downbeats.', success_criteria: 'Three clean repeats.', cat_prompt: 'Stay with the pulse!',
    }};
    const lesson = normalizeGuidedLesson({ title: snap.title, instructions: snap.instructions }, { goal: 'Old exercise goal' }, snap);
    expect(lesson.goal).toBe('Keep time.');
    expect(lesson.steps).toEqual(['Count four beats']);
    expect(lesson.listenFor).toBe('Clear downbeats.');
    expect(lesson.success).toBe('Three clean repeats.');
    expect(lesson.catPrompts).toEqual(['Stay with the pulse!']);
  });

  it('ignores malformed optional fields and safely handles missing older instructions', () => {
    const lesson = normalizeGuidedLesson({ title: '', instructions: '' }, {
      lesson: { goal: 20, steps: [{}], listenFor: null, terminologyHelp: [{ term: 'Swing' }] },
    });
    expect(lesson.title).toBe('Practice exercise');
    expect(lesson.steps).toHaveLength(1);
    expect(lesson.steps[0].length).toBeGreaterThan(0);
    expect(lesson.terminologyHelp).toEqual([]);
  });
});
