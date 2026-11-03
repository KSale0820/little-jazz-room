import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { createSupabaseCatRepository, ensureProfileRow } from './supabaseCatRepository';

const owner = '11111111-1111-4111-8111-111111111111';
function client(fetcher: typeof fetch) {
  return createClient('https://test.supabase.co', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: fetcher },
  });
}

describe('profile fallback and companion persistence', () => {
  it('creates missing profiles without resetting an existing choice on conflict', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 201 }));
    await ensureProfileRow(client(fetcher), owner);
    const [url, options] = fetcher.mock.calls[0];
    expect(String(url)).toContain('on_conflict=id');
    expect(JSON.parse(options!.body as string)).toEqual({ id: owner });
    expect(new Headers(options!.headers).get('prefer')).toContain('resolution=ignore-duplicates');
  });

  it('creates a missing row when reading without blocking content sync', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('[]', { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 201 }));
    expect(await createSupabaseCatRepository(client(fetcher), owner).readCat()).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('initializes before updating and checks that an owner row was actually updated', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 201 }))
      .mockResolvedValueOnce(new Response('{"cat_id":"milo"}', { status: 200 }));
    await createSupabaseCatRepository(client(fetcher), owner).writeCat('milo');
    const [url, options] = fetcher.mock.calls[1];
    expect(String(url)).toContain(`id=eq.${owner}`);
    expect(options!.method).toBe('PATCH');
    expect(JSON.parse(options!.body as string)).toEqual({ cat_id: 'milo' });
  });

  it('propagates a zero-row/denied update instead of silently reporting success', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 201 }))
      .mockResolvedValueOnce(new Response('{"code":"PGRST116","message":"No row returned"}', { status: 406 }));
    await expect(createSupabaseCatRepository(client(fetcher), owner).writeCat('milo')).rejects.toMatchObject({ code: 'PGRST116' });
  });
});
