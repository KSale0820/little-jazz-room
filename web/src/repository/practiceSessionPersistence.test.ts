import { createClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PracticeSessionRecord } from '../types/content';
import { SupabasePracticeRepository } from './supabasePracticeRepository';
import { createLocalRepository } from './localRepository';

const owner = '11111111-1111-4111-8111-111111111111';
const cloudRoutine = '22222222-2222-4222-8222-222222222222';
const session: PracticeSessionRecord = {
  id: '33333333-3333-4333-8333-333333333333',
  finishedAt: '2026-10-29T20:00:00.000Z',
  durationSeconds: 125,
  routineId: 'daily-warm-up',
  routineTitle: 'Daily Warm-up',
  exerciseId: 'swing-2-4',
};

function repository(fetcher: typeof fetch) {
  const client = createClient('https://test.supabase.co', 'test-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetcher },
  });
  return new SupabasePracticeRepository(client, owner);
}

afterEach(() => vi.unstubAllGlobals());

describe('cloud practice completion', () => {
  it.each(['daily-warm-up', 'local-rt-test', undefined, cloudRoutine])('saves routine reference %s without invalid UUIDs', async routineId => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 201 }));
    await repository(fetcher).addSession({ ...session, routineId });
    const [url, options] = fetcher.mock.calls[0];
    const row = JSON.parse(options!.body as string);
    expect(row).toEqual({
      id: session.id, owner_id: owner, duration_seconds: 125,
      routine_id: routineId === cloudRoutine ? cloudRoutine : null,
      routine_ref: routineId ?? null, routine_title: 'Daily Warm-up',
      exercise_ref: 'swing-2-4', finished_at: session.finishedAt,
    });
    expect(String(url)).toContain('on_conflict=id');
    expect(new Headers(options!.headers).get('prefer')).toContain('resolution=ignore-duplicates');
  });

  it('retries an acknowledged-lost insert without duplicating or changing the record', async () => {
    const rows = new Map<string, unknown>();
    let requests = 0;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_url, options) => {
      const row = JSON.parse(options!.body as string);
      if (!rows.has(row.id)) rows.set(row.id, row);
      if (++requests === 1) return new Response(JSON.stringify({ message: 'Lost response' }), { status: 503 });
      return new Response(null, { status: 201 });
    });
    const repo = repository(fetcher);
    await expect(repo.addSession(session)).rejects.toMatchObject({ message: 'Lost response' });
    await repo.addSession(session);
    expect(rows.size).toBe(1);
    expect(rows.get(session.id)).toMatchObject({ duration_seconds: 125, finished_at: session.finishedAt });
  });

  it('loads new references and legacy UUID-only history', async () => {
    const base = { id: session.id, duration_seconds: 125, exercise_ref: 'swing-2-4', finished_at: session.finishedAt };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify([
      { ...base, routine_id: null, routine_ref: 'daily-warm-up', routine_title: 'Daily Warm-up' },
      { ...base, id: 'legacy', routine_id: cloudRoutine },
    ]), { status: 200 }));
    const rows = await repository(fetcher).listMySessions();
    expect(rows[0]).toEqual(session);
    expect(rows[1].routineId).toBe(cloudRoutine);
    expect(rows[1].routineTitle).toBeUndefined();
    const [url] = fetcher.mock.calls[0];
    expect(String(url)).toContain(`owner_id=eq.${owner}`);
  });
});

describe('local practice completion', () => {
  it('persists exactly one immutable record per completion UUID across reloads', () => {
    const memory = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
    });
    const repo = createLocalRepository();
    repo.addSession(session);
    repo.addSession({ ...session, durationSeconds: 999 });
    expect(createLocalRepository().listSessions()).toEqual([session]);
    expect(createLocalRepository('other-account').listSessions()).toEqual([]);
  });

  it('reports storage failure instead of claiming success', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => { throw new Error('Quota exceeded'); },
    });
    expect(() => createLocalRepository().addSession(session)).toThrow('Quota exceeded');
  });
});
