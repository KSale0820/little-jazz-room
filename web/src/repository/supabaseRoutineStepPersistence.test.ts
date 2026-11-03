import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { exercisesById } from '../data/seed';
import { buildRoutineStepSnapshots } from '../lib/routineStepSnapshots';
import type { Routine } from '../types/content';
import { SupabasePracticeRepository } from './supabasePracticeRepository';

const owner = '11111111-1111-4111-8111-111111111111';
const routineId = '22222222-2222-4222-8222-222222222222';
const source: Routine = {
  id: 'local-rt-1', title: 'Mixed lengths', level: 'Beginner',
  duration_minutes: 13, visibility: 'private', applicable_instruments: ['Piano'],
  steps: [
    { exercise_id: 'swing-2-4', duration_minutes: 2 },
    { exercise_id: 'thirds-sevenths', duration_minutes: 4 },
    { exercise_id: 'swing-2-4', duration_minutes: 7 },
  ],
};

describe('signed-in cloud routine step persistence', () => {
  it('sends edited times, stores repeated steps separately and restores order after reload', async () => {
    let submitted: { p_routine: Record<string, unknown>; p_steps: Array<Record<string, unknown>> } | null = null;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      const target = String(url);
      if (target.includes('/rpc/save_user_routine_with_steps')) {
        submitted = JSON.parse(init!.body as string);
        return new Response(JSON.stringify({ id: routineId }), {
          status: 200, headers: { 'content-type': 'application/json' },
        });
      }
      if (target.includes('/user_routines')) {
        if (!submitted) return new Response('{}', { status: 500 });
        const row = {
          id: routineId, owner_id: owner,
          title: source.title, description: '', level: source.level,
          duration_minutes: source.duration_minutes, visibility: 'private',
          applicable_instruments: ['Piano'],
          // Simulate a DB return in an arbitrary row order: mapRoutine must sort.
          routine_steps: submitted.p_steps.map(step => ({
            ...step,
            seed_exercise_id: step.seed_exercise_id || null,
            source_exercise_id: step.source_exercise_id || null,
            snapshot_chart_id: step.snapshot_chart_id || null,
          })).reverse(),
        };
        return new Response(JSON.stringify(target.includes('order=') ? [row] : row), {
          status: 200, headers: { 'content-type': 'application/json' },
        });
      }
      return new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } });
    });
    const client = createClient('https://test.supabase.co', 'test-publishable-key', {
      auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: fetcher },
    });
    const repo = new SupabasePracticeRepository(client, owner);
    const input = buildRoutineStepSnapshots(source, Object.values(exercisesById), exercisesById);
    const saved = await repo.saveRoutine(source, input);
    expect(submitted).not.toBeNull();
    expect(submitted!.p_steps.map(step => [step.sort_order, step.seed_exercise_id, step.snapshot_duration_minutes]))
      .toEqual([[0, 'swing-2-4', 2], [1, 'thirds-sevenths', 4], [2, 'swing-2-4', 7]]);
    expect(saved.steps.map(step => [step.exercise_id, step.duration_minutes]))
      .toEqual([['swing-2-4', 2], ['thirds-sevenths', 4], ['swing-2-4', 7]]);
    const reloaded = await new SupabasePracticeRepository(client, owner).listMyRoutines();
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0]!.steps.map(step => [step.exercise_id, step.duration_minutes]))
      .toEqual([['swing-2-4', 2], ['thirds-sevenths', 4], ['swing-2-4', 7]]);
  });
});
